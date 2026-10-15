// Service untuk integrasi Chatbot Harumony.id dengan Google AI Studio (Gemini 3.5 Flash Lite)
// dan dynamic grounding dari Google Apps Script (Tab Daftar Harga & FAQ).

export interface PriceItem {
  kategori: string;
  nama_item: string;
  harga: number;
  satuan: string;
  sinonim?: string;
}

export interface FaqItem {
  pertanyaan: string;
  jawaban: string;
  kategori?: string;
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
}

const CACHE_KEY = "harumony_knowledge_cache_v1";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 menit

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
 * Mengambil data Daftar Harga dan FAQ dari Google Apps Script dengan caching.
 */
export async function getKnowledgeBase(forceRefresh = false): Promise<KnowledgeBase> {
  if (typeof window !== "undefined" && !forceRefresh) {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: KnowledgeBase = JSON.parse(cached);
        const age = Date.now() - (parsed.lastUpdated || 0);
        if (age < CACHE_TTL_MS && parsed.prices?.length) {
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
      localStorage.setItem(CACHE_KEY, JSON.stringify(kb));
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
Kamu adalah asisten Customer Service virtual resmi dari "Harumony.id", toko florist & gift hand-crafted di Babelan, Bekasi.
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
 * Melakukan streaming generateContent secara realtime via SSE (Server-Sent Events)
 * Menggunakan Gemini 3.5 Flash Lite.
 */
export async function streamGeminiChat({
  messages,
  systemInstruction,
  onChunk,
  onFinish,
  onError,
  abortSignal,
}: {
  messages: { role: "user" | "model"; text: string }[];
  systemInstruction: string;
  onChunk: (chunkText: string, accumulatedText: string) => void;
  onFinish: (fullText: string) => void;
  onError: (error: Error) => void;
  abortSignal?: AbortSignal;
}): Promise<void> {
  const userMessages = messages.filter((m) => m.role === "user");
  const lastUserMsg = userMessages[userMessages.length - 1]?.text || "";
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
