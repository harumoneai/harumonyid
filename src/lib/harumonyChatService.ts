// Service untuk integrasi Chatbot Harumony.id dengan Google AI Studio (Gemini 3.5 Flash Lite)
// dan dynamic grounding dari Google Apps Script (Tab Daftar Harga & FAQ).
// Dilengkapi modul Caching Pertanyaan Cerdas (Instant FAQ Matching & Response Caching) untuk menghemat 100% token pada pertanyaan umum.

export interface PriceItem {
  kategori: string;
  nama_item: string;
  harga: number;
  satuan: string;
  sinonim?: string | undefined;
}

export interface FaqItem {
  pertanyaan: string;
  jawaban: string;
  kategori?: string | undefined;
}

export interface KnowledgeBase {
  prices: PriceItem[];
  faqs: FaqItem[];
  lastUpdated: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  text: string;
  timestamp: number;
  source?: "faq" | "cache" | "live" | undefined;
}

const KB_CACHE_KEY = "harumony_knowledge_cache_v1";
const KB_CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

const CHAT_CACHE_KEY = "harumony_chat_response_cache_v1";
const CHAT_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam simpan jawaban chat yang sama
const MAX_CACHE_ENTRIES = 80;

const env =
  typeof import.meta !== "undefined" && import.meta.env
    ? (import.meta.env as Record<string, string | undefined>)
    : ((typeof process !== "undefined" ? process.env : {}) as Record<string, string | undefined>);

const DEFAULT_APPS_SCRIPT_URL =
  env["VITE_APPS_SCRIPT_URL"] ||
  env["VITE_GOOGLE_SCRIPT_URL"] ||
  "https://script.google.com/macros/s/AKfycbzHrudJkEdxVGwYl2_O747j6MUQakPhLvP2bQXOurdpu4hylwaQbrUZCdjLlCw7D-T_dw/exec";

// Pembatasan kuota agar hemat & stabil
export const MAX_MESSAGE_LENGTH = 500; // Maksimal 500 huruf per pesan
export const MAX_CHATS_PER_MINUTE = 20; // Maksimal 20 pesan per menit

/**
 * Kamus singkatan bahasa sehari-hari & slang percakapan Indonesia.
 * Mengonversi variasi kata buatan pengguna menjadi kata baku untuk pencocokan FAQ instan.
 */
export const INDONESIAN_SLANG_MAP: Record<string, string> = {
  // Tanya & Lokasi
  dmn: "di mana",
  diman: "di mana",
  dimana: "di mana",
  dmana: "di mana",
  kmn: "ke mana",
  kemana: "ke mana",
  kpn: "kapan",
  knp: "kenapa",
  knpa: "kenapa",
  gmn: "bagaimana",
  gmana: "bagaimana",
  bgmn: "bagaimana",
  bgmna: "bagaimana",
  gimana: "bagaimana",
  gmna: "bagaimana",
  ap: "apa",
  apkh: "apakah",

  // Waktu & Hari
  skrg: "sekarang",
  skrang: "sekarang",
  sekrang: "sekarang",
  smpai: "sampai",
  smpe: "sampai",
  ampe: "sampai",
  hr: "hari",
  hri: "hari",
  bsk: "besok",
  mlm: "malam",

  // Kata Bantu, Partikel & Preposisi
  klo: "kalau",
  kl: "kalau",
  kalo: "kalau",
  klu: "kalau",
  kalu: "kalau",
  jg: "juga",
  jga: "juga",
  sm: "sama",
  sma: "sama",
  dgn: "dengan",
  dg: "dengan",
  dr: "dari",
  dri: "dari",
  utk: "untuk",
  untk: "untuk",
  bwt: "untuk",
  buat: "untuk",
  bgt: "banget",
  bgtu: "begitu",
  gt: "begitu",
  gitu: "begitu",
  aja: "saja",
  aj: "saja",
  ajaa: "saja",
  sj: "saja",
  sdh: "sudah",
  udh: "sudah",
  uda: "sudah",
  udah: "sudah",
  blm: "belum",
  blum: "belum",
  lom: "belum",

  // Negasi & Persetujuan
  ga: "tidak",
  gak: "tidak",
  ngga: "tidak",
  nggak: "tidak",
  gk: "tidak",
  tdk: "tidak",
  nda: "tidak",
  g: "tidak",
  iy: "iya",
  iyo: "iya",
  ya: "iya",
  yaa: "iya",

  // Kata Kerja Toko & Transaksi
  pesen: "pesan",
  order: "pesan",
  ordr: "pesan",
  psn: "pesan",
  pesenan: "pesanan",
  orderan: "pesanan",
  anter: "kirim",
  anterin: "kirim",
  ngirim: "kirim",
  kirimin: "kirim",
  dikirim: "kirim",
  ambil: "ambil",
  ngambil: "ambil",
  jemput: "ambil",
  bli: "beli",
  bl: "beli",
  bayar: "bayar",
  transfer: "transfer",
  tf: "transfer",

  // Sapaan / Panggilan
  min: "kak",
  mimin: "kak",
  admin: "kak",
  sis: "kak",
  gan: "kak",
  bro: "kak",
  kaka: "kak",
  kakak: "kak",
  sy: "saya",
  aku: "saya",
  ak: "saya",
  gw: "saya",
  gue: "saya",
  gua: "saya",

  // Kata Tanya Harga & Kata Benda Toko
  brp: "berapa",
  brapa: "berapa",
  berapo: "berapa",
  hrg: "harga",
  hrga: "harga",
  hargany: "harga",
  harganya: "harga",
  lokasiny: "lokasi",
  lokasinya: "lokasi",
  alamatny: "alamat",
  alamatnya: "alamat",
  tokony: "toko",
  tokonya: "toko",
  buketny: "buket",
  buketnya: "buket",
  ongkirny: "ongkir",
  ongkirnya: "ongkir",

  // Sifat & Kata Umum Lainnya
  bs: "bisa",
  bsa: "bisa",
  bisaa: "bisa",
  blh: "boleh",
  bkn: "bukan",
  tw: "tahu",
  tau: "tahu",
};

/**
 * Normalisasi teks pertanyaan:
 * 1. Hapus emoji & aksen
 * 2. Ubah slang / singkatan chat Indonesia menjadi kata baku
 * 3. Hapus tanda baca berlebih dan jadikan lowercase
 */
export function normalizeQuery(text: string): string {
  if (!text) return "";
  const cleaned = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Hapus emoji dan simbol non-alfanumerik
    .replace(
      /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}]/gu,
      ""
    )
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Konversi slang/singkatan kata per kata
  const words = cleaned.split(" ");
  const mappedWords = words.map((w) => INDONESIAN_SLANG_MAP[w] || w);
  return mappedWords.join(" ").replace(/\s+/g, " ").trim();
}

/**
 * Daftar FAQ Toko Resmi Harumony.id untuk pencocokan langsung (0 token).
 */
export interface DefaultFaqRule {
  id: string;
  triggers: string[];
  reply: string;
}

export const DEFAULT_STORE_FAQS: DefaultFaqRule[] = [
  {
    id: "rose_price",
    triggers: [
      "estimasi buket mawar",
      "harga buket mawar",
      "mawar merah",
      "buket mawar merah",
      "berapa buket mawar",
      "harga mawar",
    ],
    reply: `Untuk estimasi buket mawar merah di Harumony.id:
• **Mini (S)** (1–3 tangkai): mulai dari **Rp50.000 – Rp75.000**
• **Sedang (M)** (5–10 tangkai): mulai dari **Rp110.000 – Rp180.000** *(Ukuran favorit & paling proporsional!)*
• **Besar (L)** (15–20 tangkai): mulai dari **Rp250.000+**

*(Catatan: Rincian ini merupakan estimasi sementara ya Kak. Harga final tergantung jenis mawar segar/artificial serta wrapping yang Kakak pilih. Kakak bisa klik menu **Form Pesanan** atau hubungi WhatsApp Admin untuk cek stok mawar hari ini 🌸)*`,
  },
  {
    id: "same_day_delivery",
    triggers: [
      "hari yang sama",
      "sameday",
      "same day",
      "dadakan",
      "hari ini",
      "bisa sekarang",
      "kirim hari ini",
      "pesan hari ini",
      "bisa dadakan",
    ],
    reply: `Mohon maaf belum bisa ya Kak 🌸. Seluruh pemesanan buket di Harumony.id **wajib minimal 24 jam (H+1 hari kerja)** sebelum waktu pengambilan atau pengiriman.

Workshop kami buka Senin – Jumat (09.00 – 18.00 WIB) dan libur di akhir pekan. Ketentuan ini demi memastikan setiap buket hand-crafted dibuat dengan teliti, segar, dan maksimal ✨.`,
  },
  {
    id: "workshop_location",
    triggers: [
      "lokasi workshop",
      "area pengiriman",
      "lokasi toko",
      "alamat workshop",
      "alamat toko",
      "workshop babelan",
      "lokasi di mana",
      "dimana toko",
      "bisa kirim kemana",
      "bisa kirim ke mana",
      "ongkir",
    ],
    reply: `Workshop Harumony.id berlokasi di **Babelan, Kabupaten Bekasi** 📍.

• **Self-Pickup (Ambil Sendiri)**: Kakak bisa mengambil pesanan langsung ke workshop kami sesuai slot jam yang disepakati (Senin–Jumat, 09.00–18.00 WIB).
• **Area Pengiriman**: Kami melayani area Babelan, Kota Bekasi, Kabupaten Bekasi, dan sekitarnya menggunakan kurir instan/ojol pada hari kerja.

Untuk titik lokasi maps workshop atau cek estimasi ongkos kirim, silakan hubungi WhatsApp Admin kami ya Kak! 😊`,
  },
  {
    id: "snack_and_doll",
    triggers: [
      "custom buket snack",
      "snack dan boneka",
      "buket snack",
      "buket boneka",
      "bisa snack",
      "bisa boneka",
      "buket wisuda",
      "bisa custom",
    ],
    reply: `Tentu bisa banget Kak! 🎉 Kami melayani custom buket snack favorit, buket boneka (teddy bear, wisuda), buket uang, maupun kombinasi bunga + snack.

• Biaya jasa rangkai: **Mini (S) Rp30.000**, **Sedang (M) Rp50.000**, dan **Besar (L) Rp85.000** (di luar harga snack/boneka).
• Kakak bisa tentukan isian favorit lewat menu **Form Pesanan** di website ini atau diskusikan langsung via tombol **Konsultasi Desain (WhatsApp)** ya! 💐`,
  },
  {
    id: "operating_hours",
    triggers: [
      "jam operasional",
      "jam buka",
      "buka jam",
      "hari kerja",
      "sabtu buka",
      "minggu buka",
      "jadwal buka",
      "hari apa aja buka",
    ],
    reply: `Jadwal operasional Harumony.id (Workshop & Balas Chat Admin):
• **Hari Kerja (Senin – Jumat)**: 09.00 – 18.00 WIB
• **Akhir Pekan (Sabtu & Minggu)**: **Libur Penuh** (tidak ada produksi, pickup, pengiriman, maupun balasan chat)

Pesan yang masuk di luar jam kerja atau akhir pekan akan kami balas dengan senang hati pada hari kerja berikutnya mulai pukul 09.00 WIB ya Kak 🌸.`,
  },
  {
    id: "how_to_order",
    triggers: [
      "cara pesan",
      "cara order",
      "gimana cara pesan",
      "langkah pemesanan",
      "mau pesan",
      "mau order",
      "form pesanan",
    ],
    reply: `Cara pemesanan di Harumony.id sangat mudah Kak! 😊
1. Klik menu **Form Pesanan** di bagian bawah website ini untuk memilih jenis buket, ukuran, dan menuliskan kartu ucapan.
2. Atau jika ingin request konsep buket khusus/custom, klik tombol **Konsultasi Desain** di bagian atas untuk terhubung langsung dengan WhatsApp Admin (0857-7355-2946).

*Catatan: Pemesanan buket wajib minimal H+1 hari kerja (24 jam sebelumnya) ya Kak! 💐*`,
  },
  {
    id: "admin_contact",
    triggers: [
      "nomor wa",
      "nomor admin",
      "kontak wa",
      "whatsapp admin",
      "chat admin",
      "nomor telepon",
    ],
    reply: `Kakak bisa langsung menghubungi WhatsApp Admin resmi Harumony.id di nomor **0857-7355-2946** (atau klik tautan https://wa.me/6285773552946) 🌸. Admin kami siap membantu pada hari kerja (Senin–Jumat, 09.00–18.00 WIB).`,
  },
];

/**
 * Aturan kombinasi intent cerdas:
 * Memeriksa keberadaan kata kunci dari grup A DAN grup B tanpa terikat urutan kata.
 */
interface IntentCombinationRule {
  id: string;
  anyGroupA: string[];
  anyGroupB: string[];
  excludeWords?: string[];
  reply: string;
}

const INTENT_COMBINATION_RULES: IntentCombinationRule[] = [
  {
    id: "operating_hours_combo",
    anyGroupA: ["buka", "tutup", "operasional", "jadwal", "libur", "kerja"],
    anyGroupB: ["jam", "hari", "sabtu", "minggu", "kapan", "waktu", "sampai"],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "operating_hours")!.reply,
  },
  {
    id: "same_day_combo",
    anyGroupA: [
      "hari ini",
      "sekarang",
      "sameday",
      "same day",
      "dadakan",
      "buru buru",
      "langsung jadi",
      "hari yang sama",
      "hari h",
      "harih",
      "langsung kirim",
    ],
    anyGroupB: [
      "bisa",
      "pesan",
      "kirim",
      "order",
      "ambil",
      "beli",
      "antar",
      "ready",
      "ada",
      "mau",
    ],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "same_day_delivery")!.reply,
  },
  {
    id: "workshop_location_combo",
    anyGroupA: [
      "lokasi",
      "alamat",
      "workshop",
      "toko",
      "babelan",
      "maps",
      "titik",
      "tempat",
    ],
    anyGroupB: [
      "di mana",
      "mana",
      "sebelah mana",
      "babelan",
      "bekasi",
      "alamat",
      "lokasi",
      "ambil",
      "pickup",
    ],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "workshop_location")!.reply,
  },
  {
    id: "delivery_area_combo",
    anyGroupA: [
      "kirim",
      "pengiriman",
      "ongkir",
      "ongkos",
      "area",
      "jangkauan",
      "antar",
      "kurir",
    ],
    anyGroupB: [
      "ke mana",
      "kemana",
      "bisa",
      "berapa",
      "bekasi",
      "jakarta",
      "ojol",
      "mana",
      "area",
    ],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "workshop_location")!.reply,
  },
  {
    id: "snack_and_doll_combo",
    anyGroupA: [
      "snack",
      "makanan",
      "jajan",
      "jajanan",
      "coklat",
      "silverqueen",
      "boneka",
      "teddy",
      "bear",
      "wisuda",
      "uang",
      "money",
      "beng beng",
      "pocky",
    ],
    anyGroupB: [
      "buket",
      "custom",
      "rangkai",
      "bisa",
      "bikin",
      "buat",
      "ada",
      "jual",
      "mau",
    ],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "snack_and_doll")!.reply,
  },
  {
    id: "rose_price_combo",
    anyGroupA: ["mawar", "rose"],
    anyGroupB: ["harga", "berapa", "estimasi", "biaya", "pricelist", "range"],
    excludeWords: [
      "boneka",
      "snack",
      "emas",
      "uang",
      "silverqueen",
      "campur",
      "kombinasi",
    ],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "rose_price")!.reply,
  },
  {
    id: "how_to_order_combo",
    anyGroupA: [
      "cara",
      "bagaimana",
      "langkah",
      "tahap",
      "alur",
      "prosedur",
      "mau",
    ],
    anyGroupB: ["pesan", "order", "beli", "pemesanan", "checkout"],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "how_to_order")!.reply,
  },
  {
    id: "admin_contact_combo",
    anyGroupA: [
      "nomor",
      "kontak",
      "whatsapp",
      "wa",
      "hubungi",
      "telepon",
      "tlp",
      "hp",
    ],
    anyGroupB: ["admin", "cs", "toko", "official", "owner", "human", "chat"],
    reply: DEFAULT_STORE_FAQS.find((f) => f.id === "admin_contact")!.reply,
  },
];

const STOP_WORDS = new Set([
  "dan",
  "atau",
  "yang",
  "untuk",
  "dari",
  "ke",
  "di",
  "ini",
  "itu",
  "kak",
  "halo",
  "hai",
  "apakah",
  "apa",
  "iya",
  "kah",
  "dong",
  "sih",
]);

/**
 * Mencocokkan pertanyaan pengguna ke FAQ Toko (built-in atau dari Google Sheets).
 * Memiliki 3 lapis pencocokan:
 * 1. Pemicu langsung (Exact Trigger Substring)
 * 2. Kombinasi intent cerdas (Multi-Keyword Overlap)
 * 3. Pencocokan token dinamis dari Google Sheets FAQ
 */
export function findFaqAnswer(rawQuery: string, customFaqs?: FaqItem[]): string | null {
  const normQuery = normalizeQuery(rawQuery);
  if (!normQuery || normQuery.length < 3) return null;

  // 1. Cek pemicu langsung dari default store FAQs
  for (const rule of DEFAULT_STORE_FAQS) {
    for (const trigger of rule.triggers) {
      const normTrigger = normalizeQuery(trigger);
      if (normQuery === normTrigger || normQuery.includes(normTrigger)) {
        return rule.reply;
      }
    }
  }

  // 2. Cek kombinasi intent cerdas (Kombinasi kata acak/bahasa gaul)
  for (const combo of INTENT_COMBINATION_RULES) {
    if (combo.excludeWords?.some((word) => normQuery.includes(word))) {
      continue;
    }
    const hasGroupA = combo.anyGroupA.some((word) => normQuery.includes(word));
    const hasGroupB = combo.anyGroupB.some((word) => normQuery.includes(word));
    if (hasGroupA && hasGroupB) {
      return combo.reply;
    }
  }

  // 3. Cek custom FAQs dari Google Sheets
  if (customFaqs && customFaqs.length > 0) {
    const queryTokens = new Set(
      normQuery.split(" ").filter((w) => w.length > 2 && !STOP_WORDS.has(w))
    );

    for (const faq of customFaqs) {
      if (!faq.pertanyaan || !faq.jawaban) continue;
      const normFaqQ = normalizeQuery(faq.pertanyaan);

      // Exact match atau substring match
      if (normQuery === normFaqQ || normQuery.includes(normFaqQ) || normFaqQ.includes(normQuery)) {
        return faq.jawaban;
      }

      // Keyword token overlap
      const faqTokens = normFaqQ.split(" ").filter((w) => w.length > 2 && !STOP_WORDS.has(w));
      if (faqTokens.length > 0) {
        const matches = faqTokens.filter((t) => queryTokens.has(t)).length;
        const score = matches / faqTokens.length;
        if (score >= 0.65) {
          return faq.jawaban;
        }
      }
    }
  }

  return null;
}

interface CacheStoreItem {
  reply: string;
  timestamp: number;
}
type ChatCacheStore = Record<string, CacheStoreItem>;

/**
 * Mengambil balasan yang sudah pernah di-generate sebelumnya dari localStorage cache.
 */
export function getCachedChatResponse(query: string): string | null {
  if (typeof window === "undefined") return null;
  const key = normalizeQuery(query);
  if (!key || key.length < 4) return null;

  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    if (!raw) return null;
    const store: ChatCacheStore = JSON.parse(raw);
    const item = store[key];
    if (!item) return null;

    // Cek kadaluarsa TTL (24 jam)
    if (Date.now() - item.timestamp > CHAT_CACHE_TTL_MS) {
      delete store[key];
      localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(store));
      return null;
    }

    return item.reply;
  } catch {
    return null;
  }
}

/**
 * Menyimpan hasil jawaban AI ke localStorage cache untuk pertanyaan berikutnya.
 */
export function setCachedChatResponse(query: string, reply: string): void {
  if (typeof window === "undefined" || !reply) return;
  const key = normalizeQuery(query);
  if (!key || key.length < 4) return;

  try {
    const raw = localStorage.getItem(CHAT_CACHE_KEY);
    const store: ChatCacheStore = raw ? JSON.parse(raw) : {};

    // Batasi ukuran cache agar tidak memenuhi memori browser
    const keys = Object.keys(store);
    if (keys.length >= MAX_CACHE_ENTRIES) {
      const sortedKeys = keys.sort((a, b) => (store[a]?.timestamp || 0) - (store[b]?.timestamp || 0));
      for (let i = 0; i < 20; i++) {
        if (sortedKeys[i]) delete store[sortedKeys[i]!];
      }
    }

    store[key] = {
      reply,
      timestamp: Date.now(),
    };
    localStorage.setItem(CHAT_CACHE_KEY, JSON.stringify(store));
  } catch {
    // Abaikan jika quota localStorage penuh
  }
}

/**
 * Menghapus cache riwayat obrolan AI jika diinginkan (misal saat refresh katalog).
 */
export function clearChatResponseCache(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(CHAT_CACHE_KEY);
  } catch {
    // Ignore
  }
}

/**
 * Simulasi efek mengetik (typewriter) yang halus untuk respon cache & FAQ.
 * Menghadirkan pengalaman alami seperti asisten virtual tanpa menunggu API.
 */
export async function simulateTyping({
  text,
  onChunk,
  onFinish,
  abortSignal,
  speedMs = 12,
}: {
  text: string;
  onChunk: (chunkText: string, accumulatedText: string) => void;
  onFinish: (fullText: string) => void;
  abortSignal?: AbortSignal | undefined;
  speedMs?: number | undefined;
}): Promise<void> {
  const words = text.split(/(\s+)/);
  let accumulated = "";
  for (let i = 0; i < words.length; i++) {
    if (abortSignal?.aborted) return;
    accumulated += words[i];
    onChunk(words[i]!, accumulated);
    if (words[i] && words[i]!.trim().length > 0) {
      await new Promise((r) => setTimeout(r, speedMs));
    }
  }
  onFinish(text);
}

/**
 * Mengambil data Daftar Harga dan FAQ dari Google Apps Script dengan caching.
 */
export async function getKnowledgeBase(forceRefresh = false): Promise<KnowledgeBase> {
  if (typeof window !== "undefined" && !forceRefresh) {
    try {
      const cached = localStorage.getItem(KB_CACHE_KEY);
      if (cached) {
        const parsed: KnowledgeBase = JSON.parse(cached);
        const age = Date.now() - (parsed.lastUpdated || 0);
        if (age < KB_CACHE_TTL_MS && parsed.prices?.length) {
          return parsed;
        }
      }
    } catch {
      // Ignore localStorage read errors
    }
  }

  // Fetch paralel dari Apps Script (tanpa custom headers untuk hindari CORS preflight OPTIONS)
  const fetchPrices = fetch(DEFAULT_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "get_daftar_harga" }),
  })
    .then((r) => r.json())
    .catch(() => ({ ok: false, data: [] }));

  const fetchFaqs = fetch(DEFAULT_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({ action: "get_faq" }),
  })
    .then((r) => r.json())
    .catch(() => ({ ok: false, data: [] }));

  const [pricesRes, faqsRes] = await Promise.all([fetchPrices, fetchFaqs]);

  const prices: PriceItem[] = pricesRes?.ok && Array.isArray(pricesRes.data) ? pricesRes.data : [];
  const faqs: FaqItem[] = faqsRes?.ok && Array.isArray(faqsRes.data) ? faqsRes.data : [];

  const kb: KnowledgeBase = {
    prices,
    faqs,
    lastUpdated: Date.now(),
  };

  if (typeof window !== "undefined" && prices.length > 0) {
    try {
      localStorage.setItem(KB_CACHE_KEY, JSON.stringify(kb));
    } catch {
      // Ignore quota exceeded
    }
  }

  return kb;
}

/**
 * Menyusun System Instruction lengkap dengan grounding dinamis dari Spreadsheet.
 */
export function buildSystemInstruction(kb: KnowledgeBase): string {
  // Susun tabel harga
  const priceListStr = kb.prices.length
    ? kb.prices
        .map(
          (p) =>
            `- [${p.kategori || "Umum"}] ${p.nama_item}: Rp${Number(p.harga).toLocaleString(
              "id-ID"
            )} per ${p.satuan || "pcs"}${p.sinonim ? ` (alias: ${p.sinonim})` : ""}`
        )
        .join("\n")
    : "- Hubungi Admin WhatsApp untuk rincian katalog bunga dan harga.";

  // Susun FAQ
  const faqListStr = kb.faqs.length
    ? kb.faqs
        .map((f) => `Q: ${f.pertanyaan}\nA: ${f.jawaban}`)
        .join("\n\n")
    : "- Pemesanan wajib minimal H+1 hari kerja dan 24 jam sebelum waktu pengambilan (Senin–Jumat, 09.00–18.00 WIB).";

  return `# ROLE & IDENTITAS
Nama resmi kamu adalah "Harumony Concierge", asisten Customer Service virtual resmi dari "Harumony.id", toko florist & gift hand-crafted di Babelan, Bekasi.
Ketika menyapa atau memperkenalkan diri, SELALU perkenalkan dirimu sebagai "Harumony Concierge" (DILARANG menggunakan nama "Harumoni bot" atau sebutan lainnya).
Tugasmu: menyapa calon pembeli dengan ramah dan elegan, memberikan informasi buket & estimasi harga berdasarkan DAFTAR HARGA resmi toko, serta mengarahkan ke Form Pemesanan website atau WhatsApp admin.

# GAYA KOMUNIKASI & NADA BICARA
- Ramah, sopan, hangat, santun khas florist estetik.
- Selalu menyapa pelanggan dengan panggilan "Kak" atau "Kakak".
- Respon singkat, padat, dan jelas (maksimal 2–3 kalimat per jawaban). Jika merinci harga atau estimasi komponen, gunakan poin-poin singkat yang rapi.
- Hindari bahasa robot atau kaku. Gunakan bahasa Indonesia yang luwes dan sertakan emoji secukupnya (🌸, 💐, ✨, 😊).

# INFORMASI BISNIS HARUMONY.ID
- Nama Toko: Harumony.id (Florist & Gift)
- Lokasi Workshop: Babelan, Kabupaten Bekasi.
- Jadwal Operasional Toko (Sama persis untuk Balas Chat Admin & Pickup/Pengiriman Workshop):
  * Hari Operasional: Senin – Jumat (Hari Kerja).
  * Jam Operasional: 09.00 – 18.00 WIB.
  * Akhir Pekan (Sabtu & Minggu): Libur penuh (tidak ada produksi, pickup, pengiriman, maupun balasan chat admin). Chat di luar jam kerja akan dibalas pada hari kerja berikutnya mulai pukul 09.00 WIB.
- Area Layanan: Babelan, Kota/Kabupaten Bekasi, dan sekitarnya (sistem pickup ambil sendiri atau kurir instan florist pada hari kerja).
- Ketentuan Pemesanan: Seluruh pemesanan buket WAJIB minimal 24 jam sebelum waktu pengambilan/pengiriman di hari kerja (tidak menerima dadakan).
- Nomor WhatsApp Admin: 0857-7355-2946 (https://wa.me/6285773552946)
- Website Form: Pengunjung dapat langsung mengisi rincian bunga dan kartu ucapan di menu "Form Pesanan" di website ini.
- Fitur Webpage: Di bagian paling atas webpage (header bar), terdapat tombol "Konsultasi Desain" yang langsung terhubung ke WhatsApp Admin.

# DAFTAR HARGA RESMI (SUMBER HARGA UTAMA DARI SPREADSHEET TOKO)
${priceListStr}

# FREQUENTLY ASKED QUESTIONS (FAQ DARI SPREADSHEET TOKO)
${faqListStr}

# ATURAN & BATASAN WAJIB (STRICT GUARDRAILS)
1. **Perhitungan Buket Custom, Pilihan Ukuran, & PENEGASAN ESTIMASI SEMENTARA**:
   - Biaya Jasa Rangkai Harumony.id:
     * Mini (S): Rp30.000 (ideal untuk 1–3 item kecil atau buket bunga ringkas)
     * Sedang (M): Rp50.000 (ideal untuk 4–8 snack, buket dengan boneka teddy bear, atau buket bunga standar)
     * Besar (L): Rp85.000 (ideal untuk buket lebat, snack >8 pcs, atau buket bertingkat mewah)
   - **Jika Pelanggan Menyebutkan Ukuran** (contoh: "buket sedang", "ukuran mini", "size L"):
     Hitung rincian: (Jumlah x Harga Item) + Jasa Rangkai ukuran yang dipilih pelanggan.
   - **JIKA PELANGGAN TIDAK MENYEBUTKAN UKURAN (ATURAN REKOMENDASI PINTAR)**:
     * AI WAJIB merekomendasikan 1 ukuran yang paling pas dan proporsional berdasarkan volume barangnya (contoh: jika ada boneka teddy bear atau isi 6 snack, rekomendasikan ukuran **Sedang (M)** agar rangkaian terlihat seimbang dan rapi).
     * Berikan rincian harga komponen + estimasi total untuk ukuran rekomendasi tersebut.
     * Sebutkan secara ringkas alternatif ukuran lain (contoh: "Atau jika Kakak ingin versi lebih ringkas Mini (S) estimasinya sekitar Rp... dan untuk versi lebih mekar/mewah Besar (L) sekitar Rp...").
     * Tanyakan dengan ramah: "Kira-kira Kakak lebih cocok dengan ukuran Sedang (M) atau ingin ukuran lainnya? 😊"
   - **PENEGASAN ESTIMASI SEMENTARA (WAJIB)**: Tepat setelah menyebutkan estimasi harga, AI WAJIB menegaskan bahwa angka tersebut **HANYA ESTIMASI SEMENTARA**. Jelaskan bahwa harga final, detail wrapping/pita, dan ketersediaan stok akan dikonfirmasi oleh Admin via WhatsApp atau saat Form Pesanan diproses.

2. **JIKA ADA ITEM YANG TIDAK ADA DI DATABASE (SANGAT PENTING)**:
   - Jika pelanggan meminta barang yang komponennya TIDAK ADA di DAFTAR HARGA (misal: emas Antam, anggrek hitam, uang tunai, laptop, dsb), atau meminta kombinasi yang melibatkan barang yang tidak ada di daftar:
     * **JANGAN sebutkan harga item yang ada** (contoh: jika tanya "mawar merah + emas Antam", jangan sebutkan harga mawar merah sama sekali).
     * Jangan berikan perhitungan atau estimasi harga apapun.
     * Cukup sampaikan dengan ramah bahwa item tersebut belum tersedia di katalog resmi / memerlukan konfirmasi khusus.
     * **WAJIB arahkan pelanggan untuk klik tombol "Konsultasi Desain" di bagian atas webpage** (atau hubungi WhatsApp Admin di 0857-7355-2946 / https://wa.me/6285773552946) agar tim toko bisa membantu mengecekkan ketersediaan khusus tersebut.

3. **Kebijakan Diskon & Promo**:
   - Dilarang memberikan diskon, potongan harga, atau promo di luar yang tertulis resmi. Jika pelanggan menawar atau meminta diskon (misal "Bisa diskon 50% nggak kak?"), tolak dengan sopan bahwa harga kami sudah nett/terbaik sebanding dengan kualitas bunga dan seni rangkai buket handcrafted.

4. **Kepastian Jadwal & Anti-Halusinasi**:
   - Jangan pernah menjanjikan jam/tanggal pasti selesai atau kirim (contoh: "Besok sore pasti jadi ya?"). Selalu jelaskan ketentuan minimal pengerjaan 24 jam dan tegaskan bahwa kepastian slot jadwal pengiriman harus dikonfirmasi oleh admin.
   - Dilarang menjanjikan stok warna bunga segar hari ini sebelum admin mengecek workshop.

5. **Etika Terhadap Pesaing**:
   - Dilarang menjelekkan, merendahkan, atau membandingkan secara negatif toko bunga lain/pesaing (contoh jika ditanya "Bagusan mana sama toko sebelah?"). Tetap santun, hargai toko lain, dan fokus jelaskan keunggulan Harumony.id (rangkaian estetik klasik, bunga segar pilihan, dan dikerjakan penuh cinta).

6. **Alur Pemesanan (Call-to-Action)**:
   - Jika pengunjung menyatakan ingin memesan (contoh: "Saya mau pesan 3", "Mau order buket mawar"), langsung arahkan untuk mengisi menu **Form Pesanan** di bagian bawah website atau klik tombol **"Konsultasi Desain"** di header untuk konfirmasi via WhatsApp admin (0857-7355-2946).

7. **Pertanyaan di Luar Topik (Out of Scope)**:
   - Jika pengunjung bertanya hal umum di luar layanan toko/bunga (contoh: "Siapa presiden Amerika?", pertanyaan politik, rumus fisika), jawab dengan sangat singkat dan sopan, lalu ajak kembali ke topik layanan buket bunga & gift Harumony.id.

8. **Keamanan & Data Sensitif**:
   - Jika pengunjung mengirimkan nomor rekening, kartu ATM, PIN, OTP, password, atau data pribadi sensitif (contoh: "Ini nomor rekening saya..."), tolak dengan tegas namun sopan. Jelaskan bahwa chatbot ini tidak meminta/menyimpan data perbankan, dan segala instruksi pembayaran resmi hanya dilakukan melalui admin WhatsApp resmi toko.`;
}

/**
 * Mengirim pesan ke AI Studio / Gemini API dengan perlindungan Caching cerdas:
 * 1. Cek pencocokan FAQ resmi (0 token).
 * 2. Cek riwayat respon tersimpan di cache lokal (0 token).
 * 3. Jika belum pernah ditanyakan, baru panggil API Gemini dan simpan hasilnya ke cache.
 */
export async function streamGeminiChat({
  messages,
  systemInstruction,
  knowledgeBase,
  enableCache = true,
  onChunk,
  onFinish,
  onError,
  onSource,
  abortSignal,
}: {
  messages: { role: "user" | "model"; text: string }[];
  systemInstruction: string;
  knowledgeBase?: KnowledgeBase | null | undefined;
  enableCache?: boolean | undefined;
  onChunk: (chunkText: string, accumulatedText: string) => void;
  onFinish: (fullText: string) => void;
  onError: (error: Error) => void;
  onSource?: ((source: "faq" | "cache" | "live") => void) | undefined;
  abortSignal?: AbortSignal | undefined;
}): Promise<void> {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.text || "";

  // 1. CEK INSTANT FAQ MATCHING (0 TOKEN)
  if (enableCache && lastUserMsg) {
    const faqMatch = findFaqAnswer(lastUserMsg, knowledgeBase?.faqs);
    if (faqMatch) {
      onSource?.("faq");
      await simulateTyping({
        text: faqMatch,
        onChunk,
        onFinish,
        abortSignal,
        speedMs: 12,
      });
      return;
    }

    // 2. CEK LOCAL RESPONSE CACHE (0 TOKEN)
    const cachedReply = getCachedChatResponse(lastUserMsg);
    if (cachedReply) {
      onSource?.("cache");
      await simulateTyping({
        text: cachedReply,
        onChunk,
        onFinish,
        abortSignal,
        speedMs: 12,
      });
      return;
    }
  }

  // 3. PANGGIL LIVE GEMINI API (Jika belum ada di FAQ & Cache)
  onSource?.("live");
  const history = messages.slice(0, -1).map((m) => ({
    role: m.role,
    text: m.text.slice(0, MAX_MESSAGE_LENGTH),
  }));

  try {
    // POST ke Google Apps Script tanpa custom headers untuk hindari CORS preflight OPTIONS
    const response = await fetch(DEFAULT_APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "chat",
        message: lastUserMsg.slice(0, MAX_MESSAGE_LENGTH),
        history,
        systemInstruction,
      }),
      ...(abortSignal ? { signal: abortSignal } : {}),
    });

    if (!response.ok) {
      throw new Error(`Koneksi server gagal (${response.status})`);
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      throw new Error("Gagal membaca respon dari server.");
    }
    if (data.ok === false) {
      throw new Error(data.error || "Gagal mendapatkan respon dari server.");
    }

    let replyText =
      data.reply ||
      data.response ||
      data.text ||
      data.message ||
      data.data?.reply ||
      data.data?.response ||
      data.data?.text ||
      (typeof data === "string" ? data : "");

    if (!replyText) {
      replyText = "Halo Kak! Ada yang bisa kami bantu seputar buket bunga atau pemesanan hari ini? 🌸";
    }

    // Simpan ke Cache jika respon valid dan caching aktif
    if (enableCache && replyText && lastUserMsg) {
      setCachedChatResponse(lastUserMsg, replyText);
    }

    // Efek pengetikan halus (smooth typing animation)
    const words = replyText.split(/(\s+)/);
    let accumulatedText = "";
    for (let i = 0; i < words.length; i++) {
      if (abortSignal?.aborted) return;
      accumulatedText += words[i];
      onChunk(words[i]!, accumulatedText);
      await new Promise((resolve) => setTimeout(resolve, 18));
    }

    onFinish(replyText);
  } catch (err: unknown) {
    if (abortSignal?.aborted) {
      return; // Permintaan dibatalkan oleh pengguna
    }
    const errorObj = err instanceof Error ? err : new Error(String(err));
    onError(errorObj);
  }
}
