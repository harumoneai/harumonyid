# Harumony.id — Landing Page "Romantic Vintage Still Life"

Satu halaman, Bahasa Indonesia, mobile-first, mengikuti brief secara penuh.

## Gaya
- Warna: Deep Royal Purple #430457, Lilac #D8B4E2, Dark Mahogany (~#3B1F1A), Gold #D4AF37.
- Font: Cormorant Garamond / Cinzel (judul), Jost atau DM Sans (isi), dimuat dari Google Fonts.
- Latar: panel kayu mahoni "boiserie" dibuat dengan CSS gradient + vignette; bingkai emas tipis; divider ornamen gaya Victoria (SVG emas).

## Bagian (berurutan)
1. Hero — judul, 1 kalimat manfaat, tombol "Pesan via WhatsApp", bingkai emas bergaya galeri, gambar still life (dibuat AI) di dalam bingkai.
2. Produk — judul bagian "Produk", kartu bingkai lukisan dalam baris yang bisa digeser ke samping (horizontal scroll dengan snap, swipe di HP, tombol panah kiri/kanan di desktop): Custom Bouquet (mulai Rp50.000), Cordelia Flower Bouquet (Rp100.000), Mielle Snack Bouquet (Rp75.000). Mudah ditambah produk baru nanti. Foto placeholder bergaya still life (buket + buku hardcover, cangkir teh antik, lilin, renda) — dibuat AI, mudah diganti foto asli.
3. Kenapa memilih kami — 3 keunggulan + ikon, dipisah divider sulur emas.
4. Tentang kami — 2–3 kalimat.
5. FAQ — 5 pertanyaan (accordion), memakai sapaan "Kak".
6. Form pesanan — nama, produk (pilihan), jumlah, catatan; tampilan saja (tombol kirim membuka WhatsApp dengan isi form sebagai bonus ringan).
7. Kontak & footer — WhatsApp (08xxxxx placeholder), Instagram @Harumony.id, alamat Pondok Ungu Permai, Babelan, Bekasi.

Tanpa promo, diskon, atau testimoni tambahan.

## Teknis
- Ganti src/routes/index.tsx; token warna & utilitas di src/styles.css; link font + meta SEO di head.
- 4 gambar still life dibuat AI ke src/assets.
