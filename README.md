# ABDAYS

ABDAYS, akademik bütçe takibi ve dinamik onay süreçlerini yöneten tek klasörlü React + Express + SQLite uygulamasıdır. Uygulama araştırmacı, Mali İşler Uzmanı ve dekan rollerini; proje, bütçe, satın alma talebi, bildirim ve onay akışlarıyla birlikte çalıştırır.

## Hızlı Başlangıç

```bash
npm install
npm start
```

Uygulama:

- [http://localhost:3001](http://localhost:3001)
- Sağlık kontrolü: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

İlk çalıştırmada sistem otomatik olarak:

- SQLite veritabanını oluşturur
- Roller, kullanıcılar ve onay kurallarını yükler
- Proje ve bütçe kalemlerini üretir
- Referans kataloglarını yükler
- Bildirim ve örnek talep kayıtlarını oluşturur

## Geliştirme Modu

```bash
npm run dev
```

Bu modda:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

## Rolleri ve Giriş Akışı

- `Araştırmacı` kullanıcılar `/register` üzerinden hesap oluşturabilir.
- Kayıt olan araştırmacıya otomatik başlangıç projesi ve bütçe kalemleri tanımlanır.
- `Mali İşler Uzmanı` ve `Dekan` rolleri ilk kurulum hesapları olarak sistemde hazır gelir.
- Giriş sonrası kullanıcı rolüne göre uygun sayfalara yönlendirilir.

## İlk Kurulum Hesapları

- Sistem Yöneticisi: `admin@abdays.edu.tr`
- Araştırmacı: `arastirmaci@abdays.edu.tr`
- Mali İşler Uzmanı: `uzman@abdays.edu.tr`
- Dekan: `dekan@abdays.edu.tr`
- Şifre: `Abdays2026!`

## Öne Çıkan Özellikler

- JWT oturum yönetimi ve bcrypt tabanlı güçlü parola doğrulaması
- Bildirim merkezi ve okundu bilgisi
- Bütçe bakiyesi kontrolü ve `committed_amount` rezerv mantığı
- `approval_rules` tablosundan okunan dinamik onay zinciri
- Proje bazlı bütçe kalemi seçimi
- Veritabanından gelen katalog kalemleri, öncelik ve satın alma yöntemi listeleri
- Taslak, revizyon, red ve onay süreçleri
- Mobil uyumlu dashboard ve rapor ekranları

## Referans Verisi ve Gerçekçilik

Satın alma talebi formundaki seçimli alanlar sabit dizi yerine veritabanından beslenir:

- Bütçe kategorileri
- Bütçe kalemleri
- Katalog kalemleri
- Satın alma yöntemleri
- Öncelikler

Seed edilen referans verileri, TÜBİTAK proje bütçe kalemleri ve İTÜ BAP başvuru/harcama rehberlerindeki yaygın kategorilere göre hazırlanmıştır. Bu nedenle formda makine-teçhizat, sarf malzemesi, hizmet alımı, seyahat, yazılım/lisans ve kitap/yayın gibi gerçekçi alanlar bulunur.

## Temel Kullanım Senaryosu

1. Araştırmacı giriş yapar veya kayıt olur.
2. Projesini ve bütçe kalemini seçerek talep oluşturur.
3. Sistem uygun katalog kalemlerini ve gerekli belgeleri gösterir.
4. Talep taslak kaydedilir veya onaya gönderilir.
5. Mali İşler Uzmanı talebi onaylar, reddeder veya revizyona yollar.
6. 10.000 TL ve üzerindeki talepler dekana aktarılır.
7. Nihai onayda bütçe `spent_amount` alanına işlenir.

## Proje Yapısı

```text
src/      -> React istemci uygulaması
server/   -> Express API, SQLite kurulumu ve iş kuralları
docs/     -> Yazılım tasarım belgesi
```

## Belgeler

- SDD: [docs/ABDAYS_SDD.md](./docs/ABDAYS_SDD.md)
