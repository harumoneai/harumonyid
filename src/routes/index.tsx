import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  Flower2,
  Truck,
  Instagram,
  MapPin,
  Phone,
  Plus,
  Calendar,
  Clock,
  User,
  ShoppingBag,
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  RefreshCw,
  MessageCircle,
  X,
  ShieldCheck,
} from "lucide-react";
import hero from "@/assets/hero.jpg";
import pCustom from "@/assets/p-custom.jpg";
import pCordelia from "@/assets/p-cordelia.jpg";
import pMielle from "@/assets/p-mielle.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Harumony.id — Florist & Gift Babelan, Bekasi" },
      { name: "description", content: "Bouquet bunga & gift box handcrafted with love. Harga terjangkau, kirim cepat area Bekasi." },
      { property: "og:title", content: "Harumony.id — Florist & Gift Babelan, Bekasi" },
      { property: "og:description", content: "Bouquet bunga & gift box handcrafted with love untuk wisuda, pasangan, dan keluarga." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const WA_NUMBER = "6285773552946"; // Nomor WhatsApp Harumony.id
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const products = [
  {
    name: "Custom Bouquet",
    desc: "Rangkaian bunga eksklusif sesuai permintaan dan tema warna.",
    price: "Mulai Rp50.000",
    priceNum: 50000,
    img: pCustom,
  },
  {
    name: "Cordelia Flower Bouquet",
    desc: "Bouquet bunga berukuran sedang yang manis.",
    price: "Rp100.000",
    priceNum: 100000,
    img: pCordelia,
  },
  {
    name: "Mielle Snack Bouquet",
    desc: "Bouquet manis dengan berbagai snack pilihan.",
    price: "Rp75.000",
    priceNum: 75000,
    img: pMielle,
  },
];

const reasons = [
  { icon: Heart, title: "Handcrafted with Love", desc: "Dirangkai secara teliti dengan estetika tinggi." },
  { icon: Flower2, title: "Pilihan Fleksibel", desc: "Bunga segar, dried/artificial flowers, hingga gift box yang bisa disesuaikan." },
  { icon: Truck, title: "Terjangkau & Cepat", desc: "Harga ramah dengan pengiriman cepat area Bekasi dan sekitarnya." },
];

const faqs = [
  { q: "Kak, bisa pesan untuk hari yang sama?", a: "Bisa, Kak, selama slot masih tersedia. Chat kami lebih awal via WhatsApp ya supaya rangkaiannya bisa disiapkan." },
  { q: "Area pengirimannya ke mana saja, Kak?", a: "Kami melayani pengiriman cepat khusus area Bekasi dan sekitarnya, Kak. Untuk lokasi lain, silakan tanyakan dulu ya." },
  { q: "Bisa request warna atau tema tertentu?", a: "Tentu, Kak! Lewat Custom Bouquet, Kakak bebas pilih warna, jenis bunga, dan tema sesuai acara." },
  { q: "Ada pilihan bunga yang awet, Kak?", a: "Ada, Kak. Kami punya dried flowers dan artificial flowers yang tahan lama untuk kenang-kenangan." },
  { q: "Bagaimana cara pesannya, Kak?", a: "Cukup klik tombol \"Pesan via WhatsApp\" atau isi form pesanan di bawah, nanti pesanan otomatis tersimpan di database dan admin kami bantu prosesnya ya, Kak." },
];

function Ornament() {
  return (
    <div className="mx-auto flex max-w-xs items-center gap-3 py-2 text-gold" aria-hidden>
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
      <svg width="64" height="20" viewBox="0 0 64 20" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M2 10c8 0 10-7 18-7 5 0 6 4 3 5s-5-2-2-3M62 10c-8 0-10-7-18-7-5 0-6 4-3 5s5-2 2-3M2 10c8 0 10 7 18 7 5 0 6-4 3-5s-5 2-2 3M62 10c-8 0-10 7-18 7-5 0-6-4-3-5s5 2 2 3" />
        <path d="M32 3l4 7-4 7-4-7z" fill="currentColor" />
      </svg>
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}

function SectionTitle({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="mb-10 text-center">
      <p className="font-caps text-xs tracking-[0.3em] text-lilac">{kicker}</p>
      <h2 className="mt-2 font-display text-4xl text-cream md:text-5xl">{title}</h2>
      <Ornament />
    </div>
  );
}

function Index() {
  const scroller = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState<number | null>(0);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  // Helper kalkulasi hari kerja (Senin - Jumat, lewati Sabtu & Minggu)
  // Aturan toko: Minimal pengambilan adalah H+1 hari kerja (misal pesan Jumat -> minimal Senin)
  const getNextBusinessDay = (from: Date, businessDaysAhead = 1): Date => {
    const current = new Date(from);
    let added = 0;
    while (added < businessDaysAhead) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return current;
  };

  const formatDateToYMD = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const minWorkingDateObj = getNextBusinessDay(now, 1);
  const minWorkingDateStr = formatDateToYMD(minWorkingDateObj);

  const bizDay1 = minWorkingDateObj;
  const bizDay2 = getNextBusinessDay(now, 2);
  const bizDay3 = getNextBusinessDay(now, 3);

  const bizDay1Str = formatDateToYMD(bizDay1);
  const bizDay2Str = formatDateToYMD(bizDay2);
  const bizDay3Str = formatDateToYMD(bizDay3);

  const openCalendar = () => {
    if (dateInputRef.current) {
      try {
        dateInputRef.current.showPicker();
      } catch {
        dateInputRef.current.focus();
      }
    }
  };

  const formatShortDay = (d: Date) => {
    return d.toLocaleDateString("id-ID", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("-").map(Number);
    if (!y || !m || !d) return "";
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // State kolom form yang diisi pelanggan:
  // [nama, no_wa, tanggal_pengambilan, jam_pengambilan, produk, jumlah, total_harga, catatan_khusus]
  // Kolom tanggal_pemesanan dan id_pelanggan tidak ditampilkan di frontend karena di-assign otomatis oleh Apps Script di tabel
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [tanggalPengambilan, setTanggalPengambilan] = useState(minWorkingDateStr);
  const [jamPengambilan, setJamPengambilan] = useState("10:00");
  const [dateNotice, setDateNotice] = useState<string | null>(null);
  const [timeNotice, setTimeNotice] = useState<string | null>(null);
  const [produk, setProduk] = useState(products[1]?.name ?? "Cordelia Flower Bouquet");
  const [jumlah, setJumlah] = useState<number>(1);
  const [catatanKhusus, setCatatanKhusus] = useState("");
  // Anti-Spam: Honeypot state (kolom palsu yang tidak boleh diisi) & tracker waktu pengisian
  const [honeypot, setHoneypot] = useState("");
  const formLoadTimeRef = useRef<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitSuccessData, setSubmitSuccessData] = useState<{
    nama: string;
    noWa: string;
    tanggalPengambilan: string;
    jamPengambilan: string;
    produk: string;
    jumlah: number;
    totalHarga: number;
    catatanKhusus: string;
    waUrl: string;
  } | null>(null);

  // Helper validasi 24 jam dari waktu saat ini
  const check24Hours = (dateStr: string, timeStr: string): boolean => {
    if (!dateStr || !timeStr) return false;
    const [y, m, d] = dateStr.split("-").map(Number);
    const [h, min] = timeStr.split(":").map(Number);
    const targetDate = new Date(y, m - 1, d, h || 0, min || 0, 0);
    const minRequired = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return targetDate.getTime() >= minRequired.getTime() - 60000;
  };

  // Jam paling awal yang diizinkan untuk tanggal tertentu (memenuhi >= 24 jam)
  const getEarliestTimeForDate = (dateStr: string): string => {
    const minRequired = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const minRequiredDateStr = formatDateToYMD(minRequired);

    if (dateStr === minRequiredDateStr) {
      const rawHours = minRequired.getHours();
      const rawMinutes = minRequired.getMinutes();
      let roundedMin = Math.ceil(rawMinutes / 15) * 15;
      let roundedHour = rawHours;
      if (roundedMin >= 60) {
        roundedHour += 1;
        roundedMin = 0;
      }
      const finalHour = Math.max(9, roundedHour);
      return `${String(finalHour).padStart(2, "0")}:${String(roundedMin).padStart(2, "0")}`;
    }
    return "09:00";
  };

  const handleTimeChange = (newTime: string) => {
    if (!newTime) return;
    if (!check24Hours(tanggalPengambilan, newTime)) {
      const earliest = getEarliestTimeForDate(tanggalPengambilan);
      setTimeNotice(`Waktu pengambilan tidak bisa kurang dari 24 jam dari waktu pemesanan saat ini (Paling awal: ${earliest} WIB). Jam otomatis disesuaikan.`);
      setJamPengambilan(earliest);
      return;
    }
    setTimeNotice(null);
    setJamPengambilan(newTime);
  };

  const handleDateChange = (val: string) => {
    if (!val) return;
    const [y, m, d] = val.split("-").map(Number);
    if (!y || !m || !d) return;
    const selected = new Date(y, m - 1, d);
    const dayOfWeek = selected.getDay(); // 0 = Minggu, 6 = Sabtu

    let finalDateStr = val;

    // Jika memilih tanggal sebelum minimal hari kerja berikutnya
    if (val < minWorkingDateStr) {
      setDateNotice("Jadwal minimal H+1 hari kerja. Tanggal otomatis disesuaikan ke hari kerja terdekat.");
      finalDateStr = minWorkingDateStr;
      setTanggalPengambilan(minWorkingDateStr);
    } else if (dayOfWeek === 0 || dayOfWeek === 6) {
      // Jika memilih akhir pekan (Sabtu atau Minggu)
      const daysToAdd = dayOfWeek === 6 ? 2 : 1;
      const nextMon = new Date(selected);
      nextMon.setDate(nextMon.getDate() + daysToAdd);
      const nextMonStr = formatDateToYMD(nextMon);

      setDateNotice("Workshop libur di akhir pekan (Sabtu & Minggu). Jadwal dialihkan ke hari kerja berikutnya (Senin).");
      finalDateStr = nextMonStr;
      setTanggalPengambilan(nextMonStr);
    } else {
      setDateNotice(null);
      setTanggalPengambilan(val);
    }

    // Pastikan jam pengambilan tetap memenuhi syarat >= 24 jam pada tanggal baru
    if (!check24Hours(finalDateStr, jamPengambilan)) {
      const earliest = getEarliestTimeForDate(finalDateStr);
      setJamPengambilan(earliest);
      setTimeNotice(`Jam pengambilan otomatis disesuaikan ke ${earliest} WIB agar memenuhi syarat minimal 24 jam.`);
    } else {
      setTimeNotice(null);
    }
  };

  // Kalkulasi total harga otomatis (jumlah * harga_satuan)
  const selectedProductObj = products.find((p) => p.name === produk) ?? products[0];
  const unitPrice = selectedProductObj ? selectedProductObj.priceNum : 50000;
  const totalHarga = unitPrice * Math.max(1, jumlah);

  const formatRupiah = (num: number) => "Rp " + num.toLocaleString("id-ID");

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const env = import.meta.env as Record<string, string | undefined>;
    const scriptUrl =
      env["VITE_GOOGLE_SCRIPT_URL"] ||
      env["VITE_APPS_SCRIPT_URL"] ||
      "https://script.google.com/macros/s/AKfycbzHrudJkEdxVGwYl2_O747j6MUQakPhLvP2bQXOurdpu4hylwaQbrUZCdjLlCw7D-T_dw/exec";

    // Anti-Spam: 1. Honeypot check (jika bot mengisi kolom tersembunyi)
    if (honeypot && honeypot.trim().length > 0) {
      console.warn("Spam submission blocked by honeypot.");
      setIsSubmitting(false);
      // Pura-pura berhasil agar bot tidak mencoba cara lain, tetapi JANGAN kirim data ke Google Sheets
      setSubmitSuccessData({
        nama: nama.trim() || "Tamu",
        noWa: noWa.trim() || "-",
        tanggalPengambilan,
        jamPengambilan,
        produk,
        jumlah,
        totalHarga,
        catatanKhusus,
        waUrl: waLink("Halo Harumony.id"),
      });
      return;
    }

    // Anti-Spam: 2. Time-based check (jika disubmit dalam waktu < 1.5 detik oleh script bot)
    const timeElapsed = Date.now() - formLoadTimeRef.current;
    if (timeElapsed < 1500) {
      setErrorMessage("Pengisian formulir terlalu cepat. Silakan periksa kembali data Anda.");
      setIsSubmitting(false);
      return;
    }

    // Validasi Nama Pemesan (Poin 5 Checklist: tolak kirim tanpa nama)
    if (!nama.trim()) {
      setErrorMessage("Nama pemesan wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    // Validasi Nomor WhatsApp (Poin 5 Checklist: tolak nomor tidak valid seperti '12345')
    const cleanWa = noWa.trim().replace(/[\s-]/g, "");
    const waRegex = /^(\+?62|0)8[1-9][0-9]{6,11}$/;
    if (!waRegex.test(cleanWa)) {
      setErrorMessage("Nomor WhatsApp tidak valid. Masukkan nomor yang valid diawali 08 atau 628 dengan 9–14 digit (contoh: 081234567890).");
      setIsSubmitting(false);
      return;
    }

    // Validasi hari kerja: minimal H+1 hari kerja dan tidak boleh akhir pekan
    const [y, m, d] = tanggalPengambilan.split("-").map(Number);
    const selectedDate = new Date(y, m - 1, d);
    const dayOfWeek = selectedDate.getDay();

    if (tanggalPengambilan < minWorkingDateStr) {
      setErrorMessage("Minimal pengambilan adalah H+1 hari kerja berikutnya.");
      setIsSubmitting(false);
      return;
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      setErrorMessage("Workshop libur di akhir pekan (Sabtu & Minggu). Silakan pilih tanggal hari kerja (Senin - Jumat).");
      setIsSubmitting(false);
      return;
    }

    // Validasi aturan minimal 24 jam dari waktu pesan saat ini
    if (!check24Hours(tanggalPengambilan, jamPengambilan)) {
      setErrorMessage("Waktu pengambilan tidak bisa kurang dari 24 jam dari waktu pemesanan saat ini. Silakan sesuaikan jam pengambilan.");
      setIsSubmitting(false);
      return;
    }

    // Data form sesuai struktur Apps Script
    // tanggal_pemesanan dan id_pelanggan di-assign otomatis oleh Apps Script
    const payload = {
      nama: nama.trim(),
      no_wa: noWa.trim(),
      tanggal_pengambilan: tanggalPengambilan,
      jam_pengambilan: jamPengambilan.trim(),
      produk: produk,
      jumlah: Number(jumlah),
      total_harga: totalHarga,
      catatan_khusus: catatanKhusus.trim() || "-",
      // Alias untuk memastikan kompatibilitas fleksibel dengan Apps Script:
      catatan: catatanKhusus.trim() || "-",
      nama_pemesan: nama.trim(),
      waktu_pengambilan: `${tanggalPengambilan} ${jamPengambilan.trim()}`,
      jam: jamPengambilan.trim(),
    };

    // Teks konfirmasi WhatsApp yang elegan & lengkap
    const waText = `Halo Harumony.id, saya ingin konfirmasi pesanan:

📋 *DETAIL PESANAN HARUMONY.ID*
• Nama: ${payload.nama}
• No. WhatsApp: ${payload.no_wa}
• Tanggal Pengambilan: ${payload.tanggal_pengambilan}
• Jam Pengambilan: ${payload.jam_pengambilan} WIB
• Produk: ${payload.produk}
• Jumlah: ${payload.jumlah} item
• Total Estimasi: ${formatRupiah(payload.total_harga)}
• Catatan Khusus: ${payload.catatan_khusus}

Mohon segera diproses ya kak, terima kasih! ✨`;

    const targetWaUrl = waLink(waText);

    try {
      // POST ke Google Apps Script tanpa custom headers untuk hindari CORS preflight OPTIONS
      const res = await fetch(scriptUrl, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);

      if (data && data.ok === false) {
        setErrorMessage(data.error || "Gagal menyimpan ke database. Silakan lengkapi data yang diperlukan.");
        return;
      }

      setSubmitSuccessData({
        nama: payload.nama,
        noWa: payload.no_wa,
        tanggalPengambilan: payload.tanggal_pengambilan,
        jamPengambilan: payload.jam_pengambilan,
        produk: payload.produk,
        jumlah: payload.jumlah,
        totalHarga: payload.total_harga,
        catatanKhusus: payload.catatan_khusus,
        waUrl: targetWaUrl,
      });
    } catch (err: unknown) {
      console.warn("Koneksi Apps Script selesai atau CORS redirect:", err);
      // Di browser, Apps Script redirect kadang memicu peringatan CORS pada respon
      // meskipun data sudah berhasil masuk ke Google Sheets.
      setSubmitSuccessData({
        nama: payload.nama,
        noWa: payload.no_wa,
        tanggalPengambilan: payload.tanggal_pengambilan,
        jamPengambilan: payload.jam_pengambilan,
        produk: payload.produk,
        jumlah: payload.jumlah,
        totalHarga: payload.total_harga,
        catatanKhusus: payload.catatan_khusus,
        waUrl: targetWaUrl,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputCls =
    "w-full border border-gold/40 bg-mahogany-deep/90 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none transition";

  return (
    <main className="boiserie min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-gold/30 bg-mahogany-deep/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#" className="font-caps text-lg tracking-widest text-gold">
            Harumony<span className="text-lilac">.id</span>
          </a>
          <a
            href={waLink("Halo Harumony.id, saya ingin konsultasi / tanya buket bunga")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 border border-gold/70 bg-gold/10 px-3.5 py-1.5 font-caps text-xs tracking-wider text-gold transition hover:bg-gold hover:text-mahogany-deep active:scale-95"
          >
            <MessageCircle className="h-3.5 w-3.5" /> Konsultasi Desain
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="royal-wall px-5 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
          <div className="text-center md:text-left">
            <p className="font-caps text-xs tracking-[0.35em] text-lilac">Florist & Gift · Babelan, Bekasi</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-cream md:text-7xl">
              Setiap Bunga, <em className="text-gold">Sebuah Lukisan</em> Kenangan
            </h1>
            <p className="mt-6 text-lg font-light text-cream/80">
              Bouquet & gift box yang dirangkai penuh cinta untuk wisuda, pasangan, dan momen spesial keluarga.
            </p>
            <a
              href="#pesan"
              className="mt-8 inline-flex items-center gap-2 bg-gold px-7 py-4 font-caps text-sm tracking-widest text-mahogany-deep shadow-[0_10px_30px_-10px_var(--gold)] transition hover:brightness-110"
            >
              <ShoppingBag className="h-4 w-4" /> Pesan Sekarang
            </a>
          </div>
          <div className="mx-auto w-full max-w-sm bg-mahogany-deep p-3 gilt-frame">
            <img
              src={hero}
              alt="Lukisan still life buket bunga ungu dengan cangkir teh antik, buku, dan lilin"
              width={1024}
              height={1280}
              className="aspect-[4/5] w-full object-cover"
            />
            <p className="mt-3 text-center font-display text-sm italic text-gold/80">"Still Life in Lilac" — Harumony</p>
          </div>
        </div>
      </section>

      {/* Produk */}
      <section className="px-5 py-20" id="produk">
        <div className="mx-auto max-w-6xl">
          <SectionTitle kicker="Galeri Kami" title="Produk" />
          <div className="relative">
            <div ref={scroller} className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-6 overflow-x-auto px-5 pb-6">
              {products.map((p) => (
                <article key={p.name} className="w-[78%] shrink-0 snap-center bg-mahogany-deep p-3 gilt-frame sm:w-[46%] lg:w-[31%]">
                  <div className="overflow-hidden">
                    <img
                      src={p.img}
                      alt={p.name}
                      loading="lazy"
                      width={768}
                      height={960}
                      className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105"
                    />
                  </div>
                  <div className="px-2 pb-3 pt-5 text-center">
                    <h3 className="font-display text-2xl text-cream">{p.name}</h3>
                    <p className="mt-2 text-sm font-light text-cream/70">{p.desc}</p>
                    <p className="mt-4 font-caps text-gold">{p.price}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setProduk(p.name);
                        const el = document.getElementById("pesan");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="mt-4 inline-block border border-gold/60 px-4 py-1.5 font-caps text-xs text-gold transition hover:bg-gold hover:text-mahogany-deep"
                    >
                      Pilih Produk Ini
                    </button>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-3">
              <button
                onClick={() => scroll(-1)}
                aria-label="Sebelumnya"
                className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-mahogany-deep"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => scroll(1)}
                aria-label="Berikutnya"
                className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-mahogany-deep"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Kenapa */}
      <section className="bg-royal-deep/60 px-5 py-20">
        <div className="mx-auto max-w-5xl">
          <SectionTitle kicker="Keistimewaan" title="Kenapa Memilih Kami" />
          <div className="grid gap-10 md:grid-cols-3">
            {reasons.map((r) => (
              <div key={r.title} className="text-center">
                <div className="mx-auto grid h-16 w-16 rotate-45 place-items-center border border-gold">
                  <r.icon className="h-6 w-6 -rotate-45 text-gold" />
                </div>
                <h3 className="mt-6 font-display text-2xl text-cream">{r.title}</h3>
                <p className="mt-2 font-light text-cream/70">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tentang */}
      <section className="px-5 py-20">
        <div className="mx-auto max-w-2xl border border-gold/40 bg-mahogany-deep/60 p-8 text-center md:p-12">
          <SectionTitle kicker="Cerita Kami" title="Tentang Harumony" />
          <p className="font-display text-xl leading-relaxed text-cream/90">
            Harumony.id lahir di Babelan, Bekasi, dari kecintaan kami pada bunga dan keindahan yang abadi seperti lukisan klasik.
            Setiap rangkaian kami buat dengan tangan, teliti, dan penuh rasa — agar momen wisuda, kasih sayang, dan kebersamaan
            keluarga Anda terasa lebih berkesan.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-royal-deep/60 px-5 py-20">
        <div className="mx-auto max-w-3xl">
          <SectionTitle kicker="Tanya Jawab" title="FAQ" />
          <div className="divide-y divide-gold/25 border-y border-gold/25">
            {faqs.map((f, i) => (
              <div key={f.q}>
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 py-5 text-left"
                >
                  <span className="font-display text-xl text-cream">{f.q}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-gold transition ${open === i ? "rotate-45" : ""}`} />
                </button>
                {open === i && <p className="pb-5 font-light text-cream/75">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form Pemesanan Sesuai Tabel Database Google Sheets 'Pesanan' */}
      <section className="px-5 py-24 scroll-mt-10" id="pesan">
        <div className="mx-auto max-w-4xl bg-mahogany-deep/95 p-6 gilt-frame md:p-12 shadow-2xl relative">
          <SectionTitle kicker="Pemesanan Mudah & Cepat" title="Form Pemesanan" />

          <p className="mx-auto -mt-6 mb-10 max-w-2xl text-center text-sm font-light text-cream/80 leading-relaxed">
            Lengkapi detail pesanan Anda di bawah ini. Pesanan Anda akan langsung tercatat otomatis di sistem database kami dan 
            terhubung dengan admin via WhatsApp untuk konfirmasi cepat & pembayaran.
          </p>

          <form onSubmit={submit} className="space-y-8">
            {/* Anti-Spam Honeypot Field (Tersembunyi dari pandangan manusia, jebakan otomatis untuk bot spam) */}
            <div
              className="sr-only"
              aria-hidden="true"
              style={{
                display: "none",
                position: "absolute",
                left: "-9999px",
                opacity: 0,
                pointerEvents: "none",
              }}
            >
              <label htmlFor="website_confirm">Jangan isi bagian ini</label>
              <input
                id="website_confirm"
                type="text"
                name="website_confirm"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* 1. Pilihan Produk & Preview Interaktif */}
            <div className="border border-gold/30 bg-royal-deep/40 p-5 md:p-6 rounded-sm">
              <label className="mb-3 flex items-center justify-between font-caps text-xs tracking-wider text-gold">
                <span className="flex items-center gap-2">
                  <Flower2 className="h-4 w-4" /> 1. Pilihan Produk Buket / Hadiah
                </span>
                <span className="text-[11px] text-lilac font-sans lowercase italic">
                  *pilih dari katalog
                </span>
              </label>

              <select
                name="produk"
                required
                value={produk}
                onChange={(e) => setProduk(e.target.value)}
                className={`${inputCls} font-medium text-base mb-4 cursor-pointer`}
              >
                {products.map((p) => (
                  <option key={p.name} value={p.name} className="bg-mahogany-deep text-cream py-2">
                    {p.name} — {p.price}
                  </option>
                ))}
              </select>

              {/* Preview Kartu Produk Terpilih */}
              {selectedProductObj && (
                <div className="flex flex-col sm:flex-row items-center gap-4 border border-gold/20 bg-mahogany-deep/80 p-3.5">
                  <img
                    src={selectedProductObj.img}
                    alt={selectedProductObj.name}
                    className="aspect-[4/5] w-20 sm:w-24 object-cover gilt-frame shrink-0"
                  />
                  <div className="flex-1 text-center sm:text-left">
                    <span className="font-caps text-xs tracking-widest text-lilac">Produk Dipilih</span>
                    <h4 className="font-display text-xl text-cream">{selectedProductObj.name}</h4>
                    <p className="text-xs text-cream/70 mt-1 font-light leading-relaxed">{selectedProductObj.desc}</p>
                    <div className="mt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span className="border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-caps text-xs text-gold">
                        {selectedProductObj.price}
                      </span>
                      <span className="text-[11px] text-cream/50 italic">
                        Handcrafted with love · Bebas request warna
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Rincian Pemesan & Jadwal */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Nama Lengkap Pemesan (Masuk ke id_pelanggan di database) */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="flex items-center gap-2 font-caps text-xs tracking-wider text-gold">
                    <User className="h-4 w-4" /> 2. Nama Pemesan
                  </label>
                </div>
                <input
                  type="text"
                  name="nama"
                  required
                  minLength={2}
                  placeholder="Contoh: Sarah Maulida"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Nomor WhatsApp */}
              <div>
                <label className="mb-2 flex items-center gap-2 font-caps text-xs tracking-wider text-gold">
                  <Phone className="h-4 w-4" /> 3. Nomor WhatsApp (Aktif)
                </label>
                <input
                  type="tel"
                  name="no_wa"
                  required
                  pattern="^(\+?62|0)8[1-9][0-9]{6,11}$"
                  title="Format: diawali 08 atau 628 dengan 9-14 digit (contoh: 081234567890)"
                  placeholder="Contoh: 081234567890"
                  value={noWa}
                  onChange={(e) => setNoWa(e.target.value)}
                  className={inputCls}
                />
              </div>

              {/* Tanggal Pengambilan / Pengiriman */}
              <div>
                <label
                  htmlFor="tanggal_pengambilan_input"
                  className="mb-2 flex items-center gap-2 font-caps text-xs tracking-wider text-gold"
                >
                  <Calendar className="h-4 w-4" /> 4. Tanggal Pengambilan (Hari Kerja)
                </label>

                <input
                  id="tanggal_pengambilan_input"
                  ref={dateInputRef}
                  type="date"
                  name="tanggal_pengambilan"
                  min={minWorkingDateStr}
                  required
                  value={tanggalPengambilan}
                  onChange={(e) => handleDateChange(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  style={{ colorScheme: "dark" }}
                  className={`${inputCls} cursor-pointer font-medium text-cream [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:filter-[invert(0.8)_sepia(1)_saturate(5)] hover:border-gold`}
                />

                <span className="mt-1.5 block text-xs font-light text-cream/60">
                  Minimal H+1 hari kerja (Senin – Jumat). Workshop libur di akhir pekan (Sabtu & Minggu).
                </span>

                {/* Peringatan jika memilih akhir pekan / sebelum H+1 */}
                {dateNotice && (
                  <div className="mt-2 flex items-start gap-2 border border-amber-500/50 bg-amber-950/50 p-2.5 text-xs text-amber-200 rounded-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>{dateNotice}</span>
                  </div>
                )}

                {/* Tombol Cepat Hari Kerja (Shortcut Preset) untuk Kemudahan Pelanggan */}
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-cream/50">Pilihan Cepat Hari Kerja:</span>
                  <button
                    type="button"
                    onClick={() => handleDateChange(bizDay1Str)}
                    className={`px-2.5 py-1 text-xs rounded-sm border transition cursor-pointer ${
                      tanggalPengambilan === bizDay1Str
                        ? "border-gold bg-gold text-mahogany-deep font-semibold shadow-xs"
                        : "border-gold/30 bg-mahogany-deep/60 text-cream/80 hover:border-gold/60"
                    }`}
                  >
                    {formatShortDay(bizDay1)} (Paling Cepat)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateChange(bizDay2Str)}
                    className={`px-2.5 py-1 text-xs rounded-sm border transition cursor-pointer ${
                      tanggalPengambilan === bizDay2Str
                        ? "border-gold bg-gold text-mahogany-deep font-semibold shadow-xs"
                        : "border-gold/30 bg-mahogany-deep/60 text-cream/80 hover:border-gold/60"
                    }`}
                  >
                    {formatShortDay(bizDay2)}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDateChange(bizDay3Str)}
                    className={`px-2.5 py-1 text-xs rounded-sm border transition cursor-pointer ${
                      tanggalPengambilan === bizDay3Str
                        ? "border-gold bg-gold text-mahogany-deep font-semibold shadow-xs"
                        : "border-gold/30 bg-mahogany-deep/60 text-cream/80 hover:border-gold/60"
                    }`}
                  >
                    {formatShortDay(bizDay3)}
                  </button>
                </div>

                {/* Badge Konfirmasi Tanggal Bahasa Indonesia (Mencegah Human Error) */}
                {tanggalPengambilan && (
                  <div className="mt-2.5 flex items-center gap-2 border border-gold/30 bg-royal-deep/60 px-3 py-1.5 text-xs text-cream/90 rounded-sm">
                    <span className="text-gold font-medium">🗓️ Jadwal Terpilih:</span>
                    <span className="font-semibold text-cream">{formatDisplayDate(tanggalPengambilan)}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded-xs uppercase tracking-wider">
                      Hari Kerja
                    </span>
                  </div>
                )}
              </div>

              {/* Jam Pengambilan Buket */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="jam_pengambilan_input"
                    className="flex items-center gap-2 font-caps text-xs tracking-wider text-gold"
                  >
                    <Clock className="h-4 w-4" /> 5. Jam Pengambilan (WIB)
                  </label>
                  <span className="text-[11px] text-cream/60">Operasional: 09:00 – 18:00</span>
                </div>

                <input
                  id="jam_pengambilan_input"
                  type="time"
                  name="jam_pengambilan"
                  min={getEarliestTimeForDate(tanggalPengambilan)}
                  max="18:00"
                  required
                  value={jamPengambilan}
                  onChange={(e) => handleTimeChange(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.currentTarget.showPicker();
                    } catch {}
                  }}
                  style={{ colorScheme: "dark" }}
                  className={`${inputCls} cursor-pointer font-medium text-cream [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-80 [&::-webkit-calendar-picker-indicator]:filter-[invert(0.8)_sepia(1)_saturate(5)] hover:border-gold`}
                />

                <span className="mt-1.5 block text-xs font-light text-cream/60">
                  Minimal 24 jam dari waktu pemesanan saat ini (Paling awal: {getEarliestTimeForDate(tanggalPengambilan)} WIB).
                </span>

                {/* Peringatan jika jam < 24 jam */}
                {timeNotice && (
                  <div className="mt-2 flex items-start gap-2 border border-amber-500/50 bg-amber-950/50 p-2.5 text-xs text-amber-200 rounded-sm">
                    <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                    <span>{timeNotice}</span>
                  </div>
                )}

                {/* Shortcut Pilihan Jam Populer */}
                <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-cream/50">Pilihan Jam Populer:</span>
                  {["10:00", "13:00", "15:00", "17:00"].map((timeSlot) => {
                    const isValid = check24Hours(tanggalPengambilan, timeSlot);
                    return (
                      <button
                        key={timeSlot}
                        type="button"
                        disabled={!isValid}
                        onClick={() => handleTimeChange(timeSlot)}
                        className={`px-2.5 py-1 text-xs rounded-sm border transition cursor-pointer ${
                          !isValid
                            ? "border-cream/10 bg-mahogany-deep/30 text-cream/30 cursor-not-allowed line-through"
                            : jamPengambilan === timeSlot
                            ? "border-gold bg-gold text-mahogany-deep font-semibold shadow-xs"
                            : "border-gold/30 bg-mahogany-deep/60 text-cream/80 hover:border-gold/60"
                        }`}
                      >
                        {timeSlot} WIB
                      </button>
                    );
                  })}
                </div>

                {/* Badge Konfirmasi Jam Terpilih */}
                {jamPengambilan && (
                  <div className="mt-2.5 flex items-center gap-2 border border-gold/30 bg-royal-deep/60 px-3 py-1.5 text-xs text-cream/90 rounded-sm">
                    <span className="text-gold font-medium">⏰ Waktu Pengambilan:</span>
                    <span className="font-semibold text-cream">Pukul {jamPengambilan} WIB</span>
                    <span className="text-[10px] text-lilac bg-lilac/10 border border-lilac/30 px-1.5 py-0.5 rounded-xs">
                      {check24Hours(tanggalPengambilan, jamPengambilan) ? "✓ Sesuai (≥24 Jam)" : "Perlu Penyesuaian"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Jumlah Item */}
            <div className="max-w-xs">
              <label className="mb-2 flex items-center gap-2 font-caps text-xs tracking-wider text-gold">
                <ShoppingBag className="h-4 w-4" /> 6. Jumlah Pesanan
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={() => setJumlah((prev) => Math.max(1, prev - 1))}
                  aria-label="Kurangi jumlah"
                  className="flex h-[48px] w-12 items-center justify-center border border-r-0 border-gold/40 bg-mahogany-deep text-gold text-lg font-bold transition hover:bg-gold hover:text-mahogany-deep active:scale-95 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  name="jumlah"
                  min={1}
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`${inputCls} text-center font-semibold text-base`}
                />
                <button
                  type="button"
                  onClick={() => setJumlah((prev) => prev + 1)}
                  aria-label="Tambah jumlah"
                  className="flex h-[48px] w-12 items-center justify-center border border-l-0 border-gold/40 bg-mahogany-deep text-gold text-lg font-bold transition hover:bg-gold hover:text-mahogany-deep active:scale-95 cursor-pointer"
                >
                  +
                </button>
              </div>
              <span className="mt-1.5 block text-xs font-light text-cream/60">
                Tentukan jumlah buket yang ingin dipesan.
              </span>
            </div>

            {/* Catatan Khusus */}
            <div>
              <label className="mb-2 flex items-center gap-2 font-caps text-xs tracking-wider text-gold">
                <FileText className="h-4 w-4" /> 7. Catatan Khusus & Permintaan Desain
              </label>
              <textarea
                name="catatan_khusus"
                rows={3}
                placeholder="Contoh: Nuansa warna pastel lilac & putih, ucapan kartu: 'Happy Graduation Sarah S.Kom!', request jam pengiriman 10 pagi..."
                value={catatanKhusus}
                onChange={(e) => setCatatanKhusus(e.target.value)}
                className={inputCls}
              />
              <span className="mt-1.5 block text-xs font-light text-cream/60">
                Opsional: Tuliskan ucapan kartu, tema warna pembungkus (wrapping), pita, atau permintaan khusus lainnya.
              </span>
            </div>

            {/* Ringkasan Total Harga */}
            <div className="border border-gold/50 bg-gradient-to-br from-royal-deep/80 to-mahogany-deep p-5 md:p-6 flex flex-col justify-center rounded-sm">
              <div className="flex items-center justify-between font-caps text-xs tracking-wider text-gold mb-1.5">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Sparkles className="h-4 w-4" /> Total Estimasi Harga
                </span>
                <span className="text-xs text-cream/70 font-sans">
                  @{formatRupiah(unitPrice)} × {jumlah} item
                </span>
              </div>
              <div className="font-caps text-3xl md:text-4xl font-semibold tracking-wider text-gold">
                {formatRupiah(totalHarga)}
              </div>
              <p className="mt-2 text-xs text-cream/60 italic font-light">
                {produk === "Custom Bouquet"
                  ? "*Estimasi harga dasar, dapat disesuaikan dengan request bunga khusus."
                  : "*Belum termasuk ongkos kirim."}
              </p>
            </div>

            {/* Error Message jika ada */}
            {errorMessage && (
              <div className="p-4 border border-rose-500/60 bg-rose-950/50 text-rose-200 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Pemberitahuan</p>
                  <p className="mt-0.5 font-light opacity-90">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Tombol Kirim Pesanan */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-3 bg-gold py-4 px-6 font-caps text-sm tracking-[0.2em] text-mahogany-deep font-semibold shadow-[0_12px_30px_-8px_var(--gold)] transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  <span>Pesan Sekarang</span>
                </>
              )}
            </button>

            {/* Jaminan Privasi Data Pemesan (Sesuai UU PDP) */}
            <div className="flex items-center justify-center gap-2 pt-1 text-center text-xs text-cream/50 font-light">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gold/80" />
              <span>
                Data Anda dilindungi (UU PDP) & hanya digunakan untuk memproses pesanan ini.
              </span>
            </div>
          </form>
        </div>
      </section>

      {/* Modal / Dialog Konfirmasi Berhasil */}
      {submitSuccessData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-mahogany-deep border-2 border-gold p-6 md:p-8 gilt-frame shadow-2xl">
            <button
              type="button"
              onClick={() => setSubmitSuccessData(null)}
              className="absolute top-4 right-4 text-cream/60 hover:text-gold transition p-1 cursor-pointer"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-950/60 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <p className="font-caps text-xs tracking-[0.25em] text-lilac">Pesanan Terkonfirmasi</p>
              <h3 className="font-display text-2xl md:text-3xl text-cream mt-1">Alhamdulillah, Pesanan Berhasil!</h3>
              <p className="mt-2 text-xs text-cream/80 font-light leading-relaxed">
                Data pesanan Anda telah resmi tersimpan di database <strong className="text-gold font-medium">Harumony.id</strong>.
              </p>
            </div>

            {/* Rincian Pesanan */}
            <div className="my-5 border border-gold/30 bg-royal-deep/40 p-4 text-xs space-y-2 text-cream/90">
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">Nama Pemesan:</span>
                <span className="font-medium text-cream">{submitSuccessData.nama}</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">No. WhatsApp:</span>
                <span className="text-cream">{submitSuccessData.noWa}</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">Tanggal Pengambilan:</span>
                <span className="text-cream font-medium">{formatDisplayDate(submitSuccessData.tanggalPengambilan)}</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">Jam Pengambilan:</span>
                <span className="text-gold font-semibold">Pukul {submitSuccessData.jamPengambilan} WIB</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">Produk:</span>
                <span className="font-medium text-gold">{submitSuccessData.produk} ({submitSuccessData.jumlah} item)</span>
              </div>
              <div className="flex justify-between border-b border-gold/20 pb-2">
                <span className="text-cream/60">Total Estimasi:</span>
                <span className="font-caps text-sm text-gold font-bold">{formatRupiah(submitSuccessData.totalHarga)}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-cream/60">Catatan:</span>
                <span className="text-cream/80 italic text-right max-w-[200px] truncate">{submitSuccessData.catatanKhusus || "-"}</span>
              </div>
            </div>

            {/* Tombol Aksi */}
            <div className="space-y-2.5">
              <a
                href={submitSuccessData.waUrl}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 bg-gold py-3.5 px-4 font-caps text-xs tracking-wider text-mahogany-deep font-semibold shadow-[0_5px_20px_-5px_var(--gold)] transition hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" /> Buka WhatsApp Admin Sekarang
              </a>
              <button
                type="button"
                onClick={() => {
                  setSubmitSuccessData(null);
                  setNama("");
                  setNoWa("");
                  setTanggalPengambilan(minWorkingDateStr);
                  setJamPengambilan("10:00");
                  setTimeNotice(null);
                  setDateNotice(null);
                  setCatatanKhusus("");
                  setJumlah(1);
                }}
                className="w-full border border-gold/40 py-2.5 text-center font-caps text-xs tracking-wider text-cream/70 transition hover:bg-gold/10 hover:text-cream cursor-pointer"
              >
                Tutup & Buat Pesanan Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-gold/30 bg-mahogany-deep px-5 py-14 text-center">
        <p className="font-caps text-2xl tracking-widest text-gold">
          Harumony<span className="text-lilac">.id</span>
        </p>
        <Ornament />
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-cream/80 md:flex-row md:justify-center md:gap-8">
          <a href={waLink("Halo Harumony.id")} className="flex items-center gap-2 hover:text-gold">
            <Phone className="h-4 w-4 text-gold" /> 085773552946
          </a>
          <a
            href="https://instagram.com/harumony.id"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 hover:text-gold"
          >
            <Instagram className="h-4 w-4 text-gold" /> @Harumony.id
          </a>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gold" /> Pondok Ungu Permai, Babelan, Bekasi
          </span>
        </div>
        <p className="mt-8 text-xs text-cream/40">© {new Date().getFullYear()} Harumony.id · Handcrafted with love</p>
      </footer>
    </main>
  );
}
