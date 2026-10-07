import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Heart, Flower2, Truck, Instagram, MapPin, Phone, Plus } from "lucide-react";
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

const WA_NUMBER = "628xxxxx"; // ganti dengan nomor asli
const waLink = (text: string) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;

const products = [
  { name: "Custom Bouquet", desc: "Rangkaian bunga eksklusif sesuai permintaan dan tema warna.", price: "Mulai Rp50.000", img: pCustom },
  { name: "Cordelia Flower Bouquet", desc: "Bouquet bunga berukuran sedang yang manis.", price: "Rp100.000", img: pCordelia },
  { name: "Mielle Snack Bouquet", desc: "Bouquet manis dengan berbagai snack pilihan.", price: "Rp75.000", img: pMielle },
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
  { q: "Bagaimana cara pesannya, Kak?", a: "Cukup klik tombol \"Pesan via WhatsApp\" atau isi form pesanan di bawah, nanti admin kami bantu prosesnya ya, Kak." },
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
  const [open, setOpen] = useState<number | null>(0);
  const scroll = (dir: number) => scroller.current?.scrollBy({ left: dir * scroller.current.clientWidth * 0.8, behavior: "smooth" });

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    window.open(waLink(`Halo Harumony.id, saya ${f.get("nama")} ingin pesan:\nProduk: ${f.get("produk")}\nJumlah: ${f.get("jumlah")}\nCatatan: ${f.get("catatan") || "-"}`), "_blank");
  };

  const inputCls = "w-full border border-gold/40 bg-mahogany-deep/70 px-4 py-3 text-cream placeholder:text-cream/40 focus:border-gold focus:outline-none";

  return (
    <main className="boiserie min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-gold/30 bg-mahogany-deep/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <a href="#" className="font-caps text-lg tracking-widest text-gold">Harumony<span className="text-lilac">.id</span></a>
          <a href={waLink("Halo Harumony.id, saya ingin pesan bouquet.")} target="_blank" rel="noreferrer" className="border border-gold px-4 py-1.5 font-caps text-xs tracking-widest text-gold transition hover:bg-gold hover:text-mahogany-deep">Pesan</a>
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
            <a href={waLink("Halo Harumony.id, saya ingin pesan bouquet.")} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 bg-gold px-7 py-4 font-caps text-sm tracking-widest text-mahogany-deep shadow-[0_10px_30px_-10px_var(--gold)] transition hover:brightness-110">
              <Phone className="h-4 w-4" /> Pesan via WhatsApp
            </a>
          </div>
          <div className="mx-auto w-full max-w-sm bg-mahogany-deep p-3 gilt-frame">
            <img src={hero} alt="Lukisan still life buket bunga ungu dengan cangkir teh antik, buku, dan lilin" width={1024} height={1280} className="aspect-[4/5] w-full object-cover" />
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
                    <img src={p.img} alt={p.name} loading="lazy" width={768} height={960} className="aspect-[4/5] w-full object-cover transition duration-700 hover:scale-105" />
                  </div>
                  <div className="px-2 pb-3 pt-5 text-center">
                    <h3 className="font-display text-2xl text-cream">{p.name}</h3>
                    <p className="mt-2 text-sm font-light text-cream/70">{p.desc}</p>
                    <p className="mt-4 font-caps text-gold">{p.price}</p>
                  </div>
                </article>
              ))}
            </div>
            <div className="mt-2 flex justify-center gap-3">
              <button onClick={() => scroll(-1)} aria-label="Sebelumnya" className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-mahogany-deep"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => scroll(1)} aria-label="Berikutnya" className="grid h-11 w-11 place-items-center rounded-full border border-gold/60 text-gold transition hover:bg-gold hover:text-mahogany-deep"><ChevronRight className="h-5 w-5" /></button>
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
            Harumony.id lahir di Babelan, Bekasi, dari kecintaan kami pada bunga dan keindahan yang abadi seperti lukisan klasik. Setiap rangkaian kami buat dengan tangan, teliti, dan penuh rasa — agar momen wisuda, kasih sayang, dan kebersamaan keluarga Anda terasa lebih berkesan.
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
                <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 py-5 text-left">
                  <span className="font-display text-xl text-cream">{f.q}</span>
                  <Plus className={`h-5 w-5 shrink-0 text-gold transition ${open === i ? "rotate-45" : ""}`} />
                </button>
                {open === i && <p className="pb-5 font-light text-cream/75">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="px-5 py-20" id="pesan">
        <div className="mx-auto max-w-xl bg-mahogany-deep/80 p-6 gilt-frame md:p-10">
          <SectionTitle kicker="Pesan Sekarang" title="Form Pesanan" />
          <form onSubmit={submit} className="space-y-4">
            <input required name="nama" placeholder="Nama" className={inputCls} />
            <select required name="produk" className={inputCls} defaultValue="">
              <option value="" disabled>Pilih produk</option>
              {products.map((p) => <option key={p.name}>{p.name}</option>)}
            </select>
            <input required name="jumlah" type="number" min={1} defaultValue={1} placeholder="Jumlah" className={inputCls} />
            <textarea name="catatan" rows={4} placeholder="Catatan (warna, tema, tanggal, kartu ucapan...)" className={inputCls} />
            <button className="w-full bg-gold py-4 font-caps text-sm tracking-widest text-mahogany-deep transition hover:brightness-110">Kirim Pesanan</button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/30 bg-mahogany-deep px-5 py-14 text-center">
        <p className="font-caps text-2xl tracking-widest text-gold">Harumony<span className="text-lilac">.id</span></p>
        <Ornament />
        <div className="mt-6 flex flex-col items-center gap-3 text-sm text-cream/80 md:flex-row md:justify-center md:gap-8">
          <a href={waLink("Halo Harumony.id")} className="flex items-center gap-2 hover:text-gold"><Phone className="h-4 w-4 text-gold" /> 08xxxxx</a>
          <a href="https://instagram.com/harumony.id" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-gold"><Instagram className="h-4 w-4 text-gold" /> @Harumony.id</a>
          <span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-gold" /> Pondok Ungu Permai, Babelan, Bekasi</span>
        </div>
        <p className="mt-8 text-xs text-cream/40">© {new Date().getFullYear()} Harumony.id · Handcrafted with love</p>
      </footer>
    </main>
  );
}
