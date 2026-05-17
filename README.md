# ABDAYS

ABDAYS, akademik bütçe takibi ve dinamik onay süreçlerini yöneten tek klasörlü React + Express + SQLite uygulamasıdır. Uygulama araştırmacı, Mali İşler Uzmanı ve dekan rollerini; proje, bütçe, satın alma talebi, bildirim ve onay akışlarıyla birlikte çalıştırır.

## Hızlı Başlangıç

```bash
npm install
npm start
```

Uygulama:

- [http://localhost:3001](http://localhost:3001)
- Health Check: [http://localhost:3001/api/v1/health](http://localhost:3001/api/v1/health)

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

Proje, modern ve modüler bir monolit mimariyle yapılandırılmıştır. **Frontend (React + Tailwind CSS)** ve **Backend (Express + SQLite)** aynı klasör yapısı altında temiz bir sorumluluk ayrımı (Separation of Concerns) ile geliştirilmiştir.

```text
abdays/
├── docs/                      # Yazılım ve Süreç Dokümantasyonu
│   └── ABDAYS_SDD.md          # Yazılım Tasarım Belgesi (Mimari, desenler, akışlar, test metodolojisi)
├── server/                    # Express.js REST API & Veritabanı Katmanı (Backend)
│   ├── config.js              # Sunucu yapılandırması (Port, JWT anahtarı, veritabanı yolları)
│   ├── database.js            # SQLite bağlantı, tablo şemaları oluşturma ve başlangıç verisi (seed) yönetimi
│   ├── index.js               # Sunucu ana giriş noktası, global middleware'ler ve rotaların kaydı
│   ├── data/                  # SQLite veritabanı dosyaları ve yedekleri
│   │   └── abdays.sqlite      # Aktif kullanılan ilişkisel yerel veritabanı dosyası
│   ├── middleware/            # İstek ön-işleme ve güvenlik katmanları
│   │   └── authMiddleware.js  # JWT tabanlı oturum kontrolü ve rol tabanlı yetkilendirme (RBAC)
│   ├── routes/                # API Uç Noktaları (Routes)
│   │   ├── adminRoutes.js     # Kullanıcı yönetimi ve onay kuralları yönetim uç noktaları
│   │   ├── approvalRoutes.js  # Onay zinciri kararları (onay, red, revizyon)
│   │   ├── authRoutes.js      # Giriş, kayıt, profil ve oturum kontrolü
│   │   ├── notificationRoutes.js # Bildirim alma ve okundu olarak işaretleme
│   │   ├── projectRoutes.js   # Araştırmacı projeleri ve bütçe kalemleri listeleme
│   │   └── requestRoutes.js   # Satın alma talepleri (oluşturma, düzenleme, dosya ekleme)
│   ├── services/              # İş Mantığı (Business Logic) & SQL Sorgu Katmanı
│   │   ├── adminService.js    # Sistem yöneticisi eylemleri ve dinamik onay kuralları
│   │   ├── dashboardService.js# Rol bazlı gösterge paneli (KPI) veri toplama/gruplama sorguları
│   │   ├── notificationService.js # Bildirim üretimi, alıcılara dağıtılması ve okunma durumu takibi
│   │   ├── projectService.js  # Proje limitleri, bütçe kalemleri ve bakiye kontrolleri
│   │   ├── requestService.js  # Satın alma süreci mantığı, bütçe bloke (committed) kontrolleri ve geçişler
│   │   └── userService.js     # Kullanıcı oluşturma, şifre şifreleme ve doğrulama sorguları
│   ├── uploads/               # Satın alma taleplerine eklenen proforma/fatura belgelerinin saklandığı yer
│   └── utils/                 # Sunucu ortak yardımcı araçları
│       ├── auth.js            # Parola şifreleme (bcrypt) ve JWT token oluşturma/çözme işlevleri
│       └── errors.js          # Standart hata sınıfları ve merkezi hata yakalama mekanizması
└── src/                       # React.js & Tailwind CSS İstemci Uygulaması (Frontend)
    ├── main.jsx               # React uygulamasının giriş noktası (DOM render)
    ├── index.css              # Global stiller, Tailwind CSS yönergeleri ve animasyon tanımları
    ├── context/               # Global Durum Yönetimi (State Management)
    │   └── AuthContext.jsx    # Oturum durumu, giriş/çıkış/kayıt metotları ve yetkilendirme sağlayıcısı
    ├── hooks/                 # Özel React Hook'ları
    │   └── useAuth.js         # AuthContext'e kolay ve güvenli erişim sağlayan sarmalayıcı hook
    ├── router/                # Sayfa Yönlendirme Altyapısı
    │   └── index.jsx          # React Router rota tanımları, sayfa eşleşmeleri ve ProtectedRoute sarmalı
    ├── services/              # API İletişim Servisleri (Backend Bağlantısı)
    │   ├── http.js            # Axios/Fetch tabanlı temel HTTP istemcisi (JWT token'ı isteklere otomatik ekler)
    │   ├── adminService.js    # Admin işlemleri API çağrıları
    │   ├── authService.js     # Giriş/kayıt API çağrıları
    │   ├── notificationService.js # Bildirimler API çağrıları
    │   ├── projectService.js  # Proje ve bütçe kalemi API çağrıları
    │   └── requestService.js  # Satın alma talepleri ve onay geçmişi API çağrıları
    ├── layouts/               # Sayfa Yerleşim Şablonları (Templates)
    │   └── AppShell.jsx       # Navbar ve Sidebar ile sarmalanmış ana uygulama iskeleti
    ├── components/            # Yeniden Kullanılabilir Modüler Arayüz Bileşenleri
    │   ├── layout/            # Çerçeve ve Gezinme Bileşenleri
    │   │   ├── Navbar.jsx     # Üst menü barı, kullanıcı profili ve bildirim düğmesi
    │   │   ├── Sidebar.jsx    # Giriş yapan kullanıcının rolüne göre dinamik şekillenen sol menü
    │   │   └── NotificationsPopover.jsx # Açılır bildirim paneli (Strateji deseni entegreli)
    │   ├── dashboard/         # Panel Gösterge Metrikleri ve Özet Listeler
    │   │   ├── DashboardHeader.jsx # Dinamik karşılama ekranı başlığı ve aktif rol bilgisi
    │   │   ├── StatsCard.jsx  # KPI metrik kartları (Bekleyen onaylar, kalan bütçe vb.)
    │   │   ├── ProjectCard.jsx # Proje limitleri, harcanan ve bloke bütçelerin görsel barları
    │   │   └── ApprovalQueueTable.jsx # Mali Uzman/Dekan için onay bekleyen talepleri listeleyen tablo
    │   ├── forms/             # Form Bileşenleri
    │   │   └── PurchaseRequestForm.jsx # Bütçe/katalog eşleşmeli ve dosya yükleme destekli talep formu
    │   ├── requests/          # Talep Geçmişi Bileşenleri
    │   │   └── RequestHistoryTable.jsx # Talep arama, filtreleme ve detaylı inceleme tablosu
    │   ├── charts/            # İstatistiksel Grafik Bileşenleri
    │   │   ├── BudgetStatusChart.jsx # Proje bazlı bütçe tüketim oranları grafiği
    │   │   └── RequestStatusChart.jsx # Taleplerin durum dağılımlarını gösteren grafikler
    │   └── shared/            # Ortak Yardımcı UI Elemanları
    │       ├── ProtectedRoute.jsx # Oturum durumuna ve role göre rota koruyucu ve yönlendirici
    │       ├── StatusBadge.jsx # Taleplerin durumlarına göre renkli rozetler (Taslak, Onayda, Red vb.)
    │       ├── SectionCard.jsx # Standart gölgeli beyaz panel kutusu
    │       └── LoadingSpinner.jsx # Veri yükleniyor animasyon ikonu
    ├── pages/                 # Rotalar Aracılığıyla Yüklenen Tam Ekran Sayfalar
    │   ├── LoginPage.jsx      # Kullanıcı Giriş Ekranı
    │   ├── RegisterPage.jsx   # Araştırmacı Kayıt Ekranı
    │   ├── DashboardRouterPage.jsx # Rol tipine göre (Araştırmacı, Uzman, Dekan, Admin) uygun panele yönlendirici sayfa
    │   ├── ResearcherDashboardPage.jsx # Araştırmacı ana sayfası (Projeler ve talep formuna hızlı erişim)
    │   ├── ApproverDashboardPage.jsx # Mali İşler Uzmanı ve Dekan ana sayfası (Onay kuyruğu ve bütçe izleme)
    │   ├── AdminDashboardPage.jsx # Sistem Yöneticisi ana sayfası (Kullanıcı ve kural istatistikleri)
    │   ├── ProjectsPage.jsx   # Projelerim ve Bütçe Durum Detay Ekranı
    │   ├── RequestsPage.jsx   # Satın alma taleplerim listeleme ekranı
    │   ├── RequestNewPage.jsx # Yeni satın alma talebi oluşturma ekranı
    │   ├── ApprovalsPage.jsx  # Onay geçmişi ve aktif süreçlerin detaylı takibi sayfası
    │   ├── ReportsPage.jsx    # Detaylı grafiksel bütçe ve harcama raporları sayfası
    │   ├── AdminUsersPage.jsx # Kullanıcı Yetkilendirme ve Yönetim Ekranı (Admin)
    │   ├── AdminProjectsPage.jsx # Tüm projelerin izlendiği ve yönetildiği ekran (Admin)
    │   └── AdminApprovalRulesPage.jsx # Dinamik onay limitleri ve zincir kuralları düzenleme ekranı (Admin)
    └── utils/                 # İstemci Yardımcı Araçları
        ├── authStorage.js     # JWT token'ının tarayıcı hafızasında saklanması ve yönetilmesi
        ├── formatters.js      # Para birimi (TRY) ve tarih biçimlendirme fonksiyonları
        └── notificationStrategies.jsx # Bildirim türlerine göre (Talep Gönderildi, Onaylandı, Reddedildi vb.) dinamik şablon üreten Strateji Deseni (Strategy Pattern)
```

## Belgeler

- SDD: [docs/ABDAYS_SDD.md](./docs/ABDAYS_SDD.md)
