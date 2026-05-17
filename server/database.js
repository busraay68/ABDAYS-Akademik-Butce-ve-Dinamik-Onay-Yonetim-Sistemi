import fs from 'node:fs';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'node:crypto';
import { config } from './config.js';

const nowIso = () => new Date().toISOString();

const ensureDirectory = (directory) => {
  fs.mkdirSync(directory, { recursive: true });
};

ensureDirectory(config.dataDir);
ensureDirectory(config.uploadsDir);

export const db = new Database(config.databasePath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    owner_user_id TEXT NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    fund_source TEXT NOT NULL,
    total_budget REAL NOT NULL,
    risk_level TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_user_id) REFERENCES users (id)
  )`,
  `CREATE TABLE IF NOT EXISTS budget_lines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    budget_category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    spent_amount REAL NOT NULL DEFAULT 0,
    committed_amount REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories (id)
  )`,
  `CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    source_reference TEXT,
    required_documents TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS procurement_methods (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS priorities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    sla_days INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS item_catalog (
    id TEXT PRIMARY KEY,
    budget_category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    typical_unit_price REAL NOT NULL,
    description TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories (id)
  )`,
  `CREATE TABLE IF NOT EXISTS approval_rules (
    id TEXT PRIMARY KEY,
    min_amount REAL NOT NULL,
    max_amount REAL,
    step_order INTEGER NOT NULL,
    approver_role TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_requests (
    id TEXT PRIMARY KEY,
    reference_no TEXT NOT NULL UNIQUE,
    project_id TEXT NOT NULL,
    budget_line_id TEXT NOT NULL,
    requester_id TEXT NOT NULL,
    item_name TEXT NOT NULL,
    budget_category_id TEXT NOT NULL,
    catalog_item_id TEXT NOT NULL,
    procurement_method_id TEXT NOT NULL,
    priority_id TEXT NOT NULL,
    unit TEXT NOT NULL,
    description TEXT,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    justification TEXT NOT NULL,
    status TEXT NOT NULL,
    current_step_order INTEGER,
    current_approver_role TEXT,
    last_comment TEXT,
    attachment_name TEXT,
    attachment_path TEXT,
    submitted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (budget_line_id) REFERENCES budget_lines (id),
    FOREIGN KEY (requester_id) REFERENCES users (id),
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories (id),
    FOREIGN KEY (catalog_item_id) REFERENCES item_catalog (id),
    FOREIGN KEY (procurement_method_id) REFERENCES procurement_methods (id),
    FOREIGN KEY (priority_id) REFERENCES priorities (id)
  )`,
  `CREATE TABLE IF NOT EXISTS approval_steps (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    step_order INTEGER NOT NULL,
    approver_role TEXT NOT NULL,
    status TEXT NOT NULL,
    actor_user_id TEXT,
    comment TEXT,
    acted_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES purchase_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
  )`,
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (request_id) REFERENCES purchase_requests (id) ON DELETE CASCADE,
    FOREIGN KEY (actor_user_id) REFERENCES users (id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT,
    is_read INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )`,
];

const createSchema = () => {
  schemaStatements.forEach((statement) => db.prepare(statement).run());
};

const countRows = (tableName) =>
  db.prepare(`SELECT COUNT(*) AS count FROM ${tableName}`).get().count;

const seedUsers = () => {
  if (countRows('users') > 0) {
    return;
  }

  const timestamp = nowIso();
  const passwordHash = bcrypt.hashSync('Abdays2026!', 10);
  const insert = db.prepare(
    `INSERT INTO users (id, full_name, email, password_hash, role, department, is_active, created_at, updated_at)
     VALUES (@id, @full_name, @email, @password_hash, @role, @department, @is_active, @created_at, @updated_at)`,
  );

  [
    {
      id: 'usr_admin_001',
      full_name: 'Sistem Yöneticisi',
      email: 'admin@abdays.edu.tr',
      role: 'system_admin',
      department: 'Bilgi İşlem Daire Başkanlığı',
    },
    {
      id: 'usr_researcher_001',
      full_name: 'Dr. Ayşe Yılmaz',
      email: 'arastirmaci@abdays.edu.tr',
      role: 'researcher',
      department: 'Bilgisayar Mühendisliği',
    },
    {
      id: 'usr_finance_001',
      full_name: 'Seda Kaya',
      email: 'uzman@abdays.edu.tr',
      role: 'finance_specialist',
      department: 'Mali İşler Daire Başkanlığı',
    },
    {
      id: 'usr_dean_001',
      full_name: 'Prof. Dr. Mehmet Demir',
      email: 'dekan@abdays.edu.tr',
      role: 'dean',
      department: 'Mühendislik Fakültesi',
    },
  ].forEach((user) =>
    insert.run({
      ...user,
      password_hash: passwordHash,
      is_active: 1,
      created_at: timestamp,
      updated_at: timestamp,
    }),
  );
};

const seedReferenceData = () => {
  if (countRows('budget_categories') === 0) {
    const timestamp = nowIso();
    const insertCategory = db.prepare(
      `INSERT INTO budget_categories
        (id, code, name, source_reference, required_documents, created_at, updated_at)
       VALUES
        (@id, @code, @name, @source_reference, @required_documents, @created_at, @updated_at)`,
    );

    [
      {
        id: 'cat_equipment',
        code: 'MKT',
        name: 'Makine ve Teçhizat',
        source_reference: 'TÜBİTAK araştırma desteklerinde makine/teçhizat giderleri destek kalemleri arasında yer alır.',
        required_documents: JSON.stringify([
          'Proforma fatura',
          'Teknik şartname',
          'Piyasa fiyat araştırması',
        ]),
      },
      {
        id: 'cat_consumables',
        code: 'SRF',
        name: 'Sarf ve Tüketim Malzemesi',
        source_reference: 'TÜBİTAK ve BAP uygulamalarında sarf/tüketim malzemesi temel bütçe kalemlerinden biridir.',
        required_documents: JSON.stringify([
          'Proforma fatura',
          'Malzeme listesi',
        ]),
      },
      {
        id: 'cat_service',
        code: 'HIZ',
        name: 'Hizmet Alımı',
        source_reference: 'BAP süreçlerinde hizmet alımları ayrı harcama kalemi olarak izlenir.',
        required_documents: JSON.stringify([
          'Hizmet gerekçesi',
          'Proforma fatura',
          'En az üç teklif',
        ]),
      },
      {
        id: 'cat_travel',
        code: 'SEY',
        name: 'Seyahat',
        source_reference: 'TÜBİTAK ve BAP projelerinde araştırma amaçlı seyahat ayrı bütçe kalemi olarak tanımlanır.',
        required_documents: JSON.stringify([
          'Görevlendirme yazısı',
          'Seyahat gerekçesi',
          'Ulaşım/konaklama teklifi',
        ]),
      },
      {
        id: 'cat_software',
        code: 'YAZ',
        name: 'Yazılım ve Lisans',
        source_reference: 'BAP mal/malzeme/yazılım alımları rehberlerinde yazılım lisansları ayrı alım türü olarak işlenir.',
        required_documents: JSON.stringify([
          'Proforma fatura',
          'Lisans kapsam açıklaması',
        ]),
      },
      {
        id: 'cat_books',
        code: 'KIT',
        name: 'Kitap ve Yayın',
        source_reference: 'İTÜ BAP başvuru rehberinde kitap alımlarında kütüphane ihtiyaç onayı istenir.',
        required_documents: JSON.stringify([
          'Kütüphane ihtiyaç yazısı',
          'Proforma fatura',
        ]),
      },
    ].forEach((category) =>
      insertCategory.run({
        ...category,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  }

  if (countRows('procurement_methods') === 0) {
    const timestamp = nowIso();
    const insertMethod = db.prepare(
      `INSERT INTO procurement_methods
        (id, name, description, created_at, updated_at)
       VALUES
        (@id, @name, @description, @created_at, @updated_at)`,
    );

    [
      {
        id: 'method_direct',
        name: 'Doğrudan temin',
        description: 'Teklif toplanarak doğrudan satın alma süreci yürütülür.',
      },
      {
        id: 'method_advance',
        name: 'Avanslı satın alma',
        description: 'Avans açılarak belge karşılığı mahsup yapılır.',
      },
      {
        id: 'method_service',
        name: 'Hizmet sözleşmesi',
        description: 'Hizmet alımı için sözleşme ve hakediş üzerinden işlem yapılır.',
      },
      {
        id: 'method_travel',
        name: 'Seyahat harcama talebi',
        description: 'Seyahat ve görevlendirme belgeleriyle yürütülen talep türüdür.',
      },
    ].forEach((method) =>
      insertMethod.run({
        ...method,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  }

  if (countRows('priorities') === 0) {
    const timestamp = nowIso();
    const insertPriority = db.prepare(
      `INSERT INTO priorities
        (id, name, description, sla_days, created_at, updated_at)
       VALUES
        (@id, @name, @description, @sla_days, @created_at, @updated_at)`,
    );

    [
      {
        id: 'priority_low',
        name: 'Düşük',
        description: 'Planlı alımlar için kullanılır.',
        sla_days: 15,
      },
      {
        id: 'priority_normal',
        name: 'Normal',
        description: 'Standart iş akışı içinde değerlendirilecek talepler içindir.',
        sla_days: 10,
      },
      {
        id: 'priority_high',
        name: 'Yüksek',
        description: 'Araştırma takvimini doğrudan etkileyen talepler içindir.',
        sla_days: 5,
      },
      {
        id: 'priority_critical',
        name: 'Kritik',
        description: 'Deney, saha çalışması veya teslim tarihi riski taşıyan talepler içindir.',
        sla_days: 2,
      },
    ].forEach((priority) =>
      insertPriority.run({
        ...priority,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  }

  if (countRows('item_catalog') === 0) {
    const timestamp = nowIso();
    const insertItem = db.prepare(
      `INSERT INTO item_catalog
        (id, budget_category_id, name, unit, typical_unit_price, description, created_at, updated_at)
       VALUES
        (@id, @budget_category_id, @name, @unit, @typical_unit_price, @description, @created_at, @updated_at)`,
    );

    [
      ['item_gpu', 'cat_equipment', 'GPU hızlandırıcı kart', 'adet', 18500, 'Yoğun hesaplama ve model eğitimi için araştırma donanımı'],
      ['item_storage', 'cat_equipment', 'Ağ bağlantılı depolama ünitesi', 'adet', 22000, 'Veri seti arşivleme ve yedekleme altyapısı'],
      ['item_workstation', 'cat_equipment', 'Yüksek performanslı iş istasyonu', 'adet', 42000, 'Analiz ve simülasyon çalışmaları için'],
      ['item_oscilloscope', 'cat_equipment', 'Dijital osiloskop', 'adet', 36000, 'Elektronik ölçüm ve laboratuvar testleri için'],
      ['item_pipette', 'cat_consumables', 'Mikropipet ucu seti', 'kutu', 950, 'Laboratuvar sarf malzemesi'],
      ['item_gloves', 'cat_consumables', 'Nitril eldiven', 'kutu', 420, 'Deney güvenliği için koruyucu ekipman'],
      ['item_chemicals', 'cat_consumables', 'Analitik saflıkta reaktif seti', 'set', 2750, 'Kimyasal analiz ve deneyler için'],
      ['item_ssd', 'cat_consumables', 'Harici SSD yedekleme diski', 'adet', 4100, 'Saha verilerinin güvenli taşınması için'],
      ['item_seq_service', 'cat_service', 'Numune sekanslama hizmeti', 'hizmet', 12500, 'Dış laboratuvar analiz hizmeti'],
      ['item_calibration', 'cat_service', 'Cihaz kalibrasyon hizmeti', 'hizmet', 4800, 'Ölçüm cihazlarının doğrulama hizmeti'],
      ['item_survey', 'cat_service', 'Saha veri toplama hizmeti', 'hizmet', 9600, 'Anket ve saha ölçüm desteği'],
      ['item_consulting', 'cat_service', 'İstatistik danışmanlık hizmeti', 'hizmet', 7200, 'İleri veri analizi desteği'],
      ['item_domestic_trip', 'cat_travel', 'Yurt içi saha ziyareti ulaşımı', 'kişi', 3500, 'Araştırma amaçlı ulaşım gideri'],
      ['item_conference_fee', 'cat_travel', 'Konferans katılım ücreti', 'kişi', 4800, 'Bilimsel etkinlik katılım bedeli'],
      ['item_accommodation', 'cat_travel', 'Araştırma seyahati konaklaması', 'gece', 1800, 'Belgelendirilmiş konaklama gideri'],
      ['item_matlab', 'cat_software', 'MATLAB kurumsal lisansı', 'lisans', 14500, 'Sayısal hesaplama ve modelleme yazılımı'],
      ['item_spss', 'cat_software', 'IBM SPSS lisansı', 'lisans', 9800, 'İstatistiksel analiz yazılımı'],
      ['item_nvivo', 'cat_software', 'NVivo araştırma lisansı', 'lisans', 12500, 'Nitel veri analizi yazılımı'],
      ['item_ansys', 'cat_software', 'ANSYS akademik lisansı', 'lisans', 26500, 'Mühendislik simülasyon yazılımı'],
      ['item_book_stats', 'cat_books', 'İleri istatistik yöntemleri kitabı', 'adet', 1650, 'Proje materyali olarak kullanılacak basılı kaynak'],
      ['item_book_ai', 'cat_books', 'Makine öğrenmesi referans kitabı', 'adet', 2100, 'Araştırma literatürü desteği'],
      ['item_journal_access', 'cat_books', 'Elektronik veri tabanı erişim paketi', 'abonelik', 5400, 'Dijital yayın ve veri tabanı erişimi'],
    ].forEach(([id, budgetCategoryId, name, unit, typicalUnitPrice, description]) =>
      insertItem.run({
        id,
        budget_category_id: budgetCategoryId,
        name,
        unit,
        typical_unit_price: typicalUnitPrice,
        description,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  }
};

const seedProjectsAndBudgetLines = () => {
  if (countRows('projects') > 0) {
    return;
  }

  const timestamp = nowIso();
  const insertProject = db.prepare(
    `INSERT INTO projects
      (id, owner_user_id, code, title, fund_source, total_budget, risk_level, start_date, end_date, created_at, updated_at)
     VALUES
      (@id, @owner_user_id, @code, @title, @fund_source, @total_budget, @risk_level, @start_date, @end_date, @created_at, @updated_at)`,
  );
  const insertBudgetLine = db.prepare(
    `INSERT INTO budget_lines
      (id, project_id, budget_category_id, name, allocated_amount, spent_amount, committed_amount, created_at, updated_at)
     VALUES
      (@id, @project_id, @budget_category_id, @name, @allocated_amount, @spent_amount, @committed_amount, @created_at, @updated_at)`,
  );

  const projects = [
    {
      id: 'prj_101',
      owner_user_id: 'usr_researcher_001',
      code: 'ABD-101',
      title: 'Akıllı Araştırma Platformu',
      fund_source: 'TÜBİTAK 1001',
      total_budget: 240000,
      risk_level: 'normal',
      start_date: '2026-01-15',
      end_date: '2026-12-30',
      budgetLines: [
        {
          id: 'line_101_1',
          budget_category_id: 'cat_equipment',
          name: 'Teçhizat',
          allocated_amount: 120000,
          spent_amount: 32000,
          committed_amount: 0,
        },
        {
          id: 'line_101_2',
          budget_category_id: 'cat_software',
          name: 'Yazılım Lisansı',
          allocated_amount: 50000,
          spent_amount: 14000,
          committed_amount: 0,
        },
        {
          id: 'line_101_3',
          budget_category_id: 'cat_consumables',
          name: 'Sarf Malzeme',
          allocated_amount: 70000,
          spent_amount: 10000,
          committed_amount: 0,
        },
      ],
    },
    {
      id: 'prj_102',
      owner_user_id: 'usr_researcher_001',
      code: 'ABD-102',
      title: 'Akademik Veri Analizi Laboratuvarı',
      fund_source: 'BAP',
      total_budget: 180000,
      risk_level: 'watch',
      start_date: '2026-02-01',
      end_date: '2027-01-15',
      budgetLines: [
        {
          id: 'line_102_1',
          budget_category_id: 'cat_equipment',
          name: 'Sunucu Donanımı',
          allocated_amount: 90000,
          spent_amount: 52000,
          committed_amount: 0,
        },
        {
          id: 'line_102_2',
          budget_category_id: 'cat_service',
          name: 'Eğitim ve Danışmanlık',
          allocated_amount: 40000,
          spent_amount: 5000,
          committed_amount: 0,
        },
        {
          id: 'line_102_3',
          budget_category_id: 'cat_travel',
          name: 'Veri Toplama',
          allocated_amount: 50000,
          spent_amount: 15000,
          committed_amount: 0,
        },
      ],
    },
  ];

  projects.forEach(({ budgetLines, ...project }) => {
    insertProject.run({
      ...project,
      created_at: timestamp,
      updated_at: timestamp,
    });

    budgetLines.forEach((line) =>
      insertBudgetLine.run({
        ...line,
        project_id: project.id,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );
  });
};

const seedApprovalRules = () => {
  if (countRows('approval_rules') > 0) {
    return;
  }

  const timestamp = nowIso();
  const insertRule = db.prepare(
    `INSERT INTO approval_rules
      (id, min_amount, max_amount, step_order, approver_role, is_active, created_at, updated_at)
     VALUES
      (@id, @min_amount, @max_amount, @step_order, @approver_role, 1, @created_at, @updated_at)`,
  );

  [
    {
      id: 'rule_under_10k_finance',
      min_amount: 0,
      max_amount: 9999.99,
      step_order: 1,
      approver_role: 'finance_specialist',
    },
    {
      id: 'rule_over_10k_finance',
      min_amount: 10000,
      max_amount: null,
      step_order: 1,
      approver_role: 'finance_specialist',
    },
    {
      id: 'rule_over_10k_dean',
      min_amount: 10000,
      max_amount: null,
      step_order: 2,
      approver_role: 'dean',
    },
  ].forEach((rule) =>
    insertRule.run({
      ...rule,
      created_at: timestamp,
      updated_at: timestamp,
    }),
  );
};

const seedRequests = () => {
  if (countRows('purchase_requests') > 0) {
    return;
  }

  const timestamp = nowIso();
  const insertRequest = db.prepare(
    `INSERT INTO purchase_requests
      (id, reference_no, project_id, budget_line_id, requester_id, item_name, budget_category_id, catalog_item_id, procurement_method_id, priority_id, unit, description, quantity, unit_price, total_amount, justification, status, current_step_order, current_approver_role, last_comment, attachment_name, attachment_path, submitted_at, created_at, updated_at)
     VALUES
      (@id, @reference_no, @project_id, @budget_line_id, @requester_id, @item_name, @budget_category_id, @catalog_item_id, @procurement_method_id, @priority_id, @unit, @description, @quantity, @unit_price, @total_amount, @justification, @status, @current_step_order, @current_approver_role, @last_comment, @attachment_name, @attachment_path, @submitted_at, @created_at, @updated_at)`,
  );
  const insertStep = db.prepare(
    `INSERT INTO approval_steps
      (id, request_id, step_order, approver_role, status, actor_user_id, comment, acted_at, created_at, updated_at)
     VALUES
      (@id, @request_id, @step_order, @approver_role, @status, @actor_user_id, @comment, @acted_at, @created_at, @updated_at)`,
  );
  const insertAudit = db.prepare(
    `INSERT INTO audit_logs (id, request_id, actor_user_id, action, note, created_at)
     VALUES (@id, @request_id, @actor_user_id, @action, @note, @created_at)`,
  );

  const requests = [
    {
      id: 'req_001',
      reference_no: 'REQ-2026-0001',
      project_id: 'prj_101',
      budget_line_id: 'line_101_1',
      requester_id: 'usr_researcher_001',
      item_name: 'GPU hızlandırıcı kart',
      budget_category_id: 'cat_equipment',
      catalog_item_id: 'item_gpu',
      procurement_method_id: 'method_direct',
      priority_id: 'priority_high',
      unit: 'adet',
      description: 'Deney kümeleri için hesaplama gücü',
      quantity: 1,
      unit_price: 8500,
      total_amount: 8500,
      justification: 'Model eğitim sürelerini azaltmak için gerekli.',
      status: 'awaiting_finance',
      current_step_order: 1,
      current_approver_role: 'finance_specialist',
      last_comment: 'Mali kontrol bekleniyor.',
      attachment_name: null,
      attachment_path: null,
      submitted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      committed_line_id: 'line_101_1',
      committed_amount: 8500,
      steps: [
        {
          step_order: 1,
          approver_role: 'finance_specialist',
          status: 'pending',
        },
      ],
      audits: [
        {
          actor_user_id: 'usr_researcher_001',
          action: 'submit',
          note: 'Talep onaya gönderildi.',
        },
      ],
    },
    {
      id: 'req_002',
      reference_no: 'REQ-2026-0002',
      project_id: 'prj_102',
      budget_line_id: 'line_102_1',
      requester_id: 'usr_researcher_001',
      item_name: 'Ağ bağlantılı depolama ünitesi',
      budget_category_id: 'cat_equipment',
      catalog_item_id: 'item_storage',
      procurement_method_id: 'method_direct',
      priority_id: 'priority_high',
      unit: 'adet',
      description: 'Veri seti yedekleme kapasitesi',
      quantity: 1,
      unit_price: 18000,
      total_amount: 18000,
      justification: 'Laboratuvar altyapısının veri güvenliği için gerekli.',
      status: 'awaiting_dean',
      current_step_order: 2,
      current_approver_role: 'dean',
      last_comment: 'Mali İşler onayı tamamlandı.',
      attachment_name: null,
      attachment_path: null,
      submitted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      committed_line_id: 'line_102_1',
      committed_amount: 18000,
      steps: [
        {
          step_order: 1,
          approver_role: 'finance_specialist',
          status: 'approved',
          actor_user_id: 'usr_finance_001',
          comment: 'Bütçe uygunluğu teyit edildi.',
          acted_at: timestamp,
        },
        {
          step_order: 2,
          approver_role: 'dean',
          status: 'pending',
        },
      ],
      audits: [
        {
          actor_user_id: 'usr_researcher_001',
          action: 'submit',
          note: 'Talep onaya gönderildi.',
        },
        {
          actor_user_id: 'usr_finance_001',
          action: 'approve',
          note: 'Mali İşler ilk onayı verdi.',
        },
      ],
    },
    {
      id: 'req_003',
      reference_no: 'REQ-2026-0003',
      project_id: 'prj_101',
      budget_line_id: 'line_101_2',
      requester_id: 'usr_researcher_001',
      item_name: 'MATLAB kurumsal lisansı',
      budget_category_id: 'cat_software',
      catalog_item_id: 'item_matlab',
      procurement_method_id: 'method_direct',
      priority_id: 'priority_normal',
      unit: 'lisans',
      description: 'Analiz pipeline lisansı',
      quantity: 2,
      unit_price: 3500,
      total_amount: 7000,
      justification: 'Projede zorunlu yazılım modülleri için gerekiyor.',
      status: 'revision_requested',
      current_step_order: null,
      current_approver_role: null,
      last_comment: 'Teklif belgesini güncelleyip yeniden gönderin.',
      attachment_name: null,
      attachment_path: null,
      submitted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      committed_line_id: null,
      committed_amount: 0,
      steps: [
        {
          step_order: 1,
          approver_role: 'finance_specialist',
          status: 'revision_requested',
          actor_user_id: 'usr_finance_001',
          comment: 'Teklif belgesini güncelleyip yeniden gönderin.',
          acted_at: timestamp,
        },
      ],
      audits: [
        {
          actor_user_id: 'usr_researcher_001',
          action: 'submit',
          note: 'Talep onaya gönderildi.',
        },
        {
          actor_user_id: 'usr_finance_001',
          action: 'revision_requested',
          note: 'Teklif belgesini güncelleyip yeniden gönderin.',
        },
      ],
    },
    {
      id: 'req_004',
      reference_no: 'REQ-2026-0004',
      project_id: 'prj_102',
      budget_line_id: 'line_102_2',
      requester_id: 'usr_researcher_001',
      item_name: 'İstatistik danışmanlık hizmeti',
      budget_category_id: 'cat_service',
      catalog_item_id: 'item_consulting',
      procurement_method_id: 'method_service',
      priority_id: 'priority_normal',
      unit: 'hizmet',
      description: 'Veri okuryazarlığı eğitimi',
      quantity: 1,
      unit_price: 4000,
      total_amount: 4000,
      justification: 'Araştırma ekibinin adaptasyonu için planlandı.',
      status: 'approved',
      current_step_order: null,
      current_approver_role: null,
      last_comment: 'Talep tamamlandı.',
      attachment_name: null,
      attachment_path: null,
      submitted_at: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
      committed_line_id: null,
      committed_amount: 0,
      steps: [
        {
          step_order: 1,
          approver_role: 'finance_specialist',
          status: 'approved',
          actor_user_id: 'usr_finance_001',
          comment: 'Uygun bulundu.',
          acted_at: timestamp,
        },
      ],
      audits: [
        {
          actor_user_id: 'usr_researcher_001',
          action: 'submit',
          note: 'Talep onaya gönderildi.',
        },
        {
          actor_user_id: 'usr_finance_001',
          action: 'approve',
          note: 'Talep sonuçlandırıldı.',
        },
      ],
    },
  ];

  const applyCommittedAmounts = db.prepare(
    `UPDATE budget_lines
     SET committed_amount = committed_amount + @amount,
         updated_at = @updated_at
     WHERE id = @id`,
  );

  requests.forEach((request) => {
    insertRequest.run(request);

    if (request.committed_line_id && request.committed_amount > 0) {
      applyCommittedAmounts.run({
        amount: request.committed_amount,
        id: request.committed_line_id,
        updated_at: timestamp,
      });
    }

    request.steps.forEach((step) =>
      insertStep.run({
        id: randomUUID(),
        request_id: request.id,
        step_order: step.step_order,
        approver_role: step.approver_role,
        status: step.status,
        actor_user_id: step.actor_user_id ?? null,
        comment: step.comment ?? null,
        acted_at: step.acted_at ?? null,
        created_at: timestamp,
        updated_at: timestamp,
      }),
    );

    request.audits.forEach((audit) =>
      insertAudit.run({
        id: randomUUID(),
        request_id: request.id,
        actor_user_id: audit.actor_user_id,
        action: audit.action,
        note: audit.note,
        created_at: timestamp,
      }),
    );
  });
};

const seedNotifications = () => {
  if (countRows('notifications') > 0) {
    return;
  }

  const timestamp = nowIso();
  const insertNotification = db.prepare(
    `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
     VALUES (@id, @user_id, @title, @message, @type, @link, @is_read, @created_at)`,
  );

  [
    {
      id: randomUUID(),
      user_id: 'usr_admin_001',
      title: 'Yönetim paneli hazır',
      message: 'Kullanıcı hesapları, proje atama, bütçe güncelleme ve onay kurallarını yönetebilirsiniz.',
      type: 'success',
      link: '/dashboard',
      is_read: 0,
      created_at: timestamp,
    },
    {
      id: randomUUID(),
      user_id: 'usr_researcher_001',
      title: 'Hoş geldiniz',
      message: 'İlk taleplerinizi oluşturabilir ve bütçe durumunuzu takip edebilirsiniz.',
      type: 'info',
      link: '/dashboard',
      is_read: 0,
      created_at: timestamp,
    },
    {
      id: randomUUID(),
      user_id: 'usr_finance_001',
      title: 'Bekleyen talep var',
      message: 'Karar bekleyen talepler incelemenizi bekliyor.',
      type: 'warning',
      link: '/approvals',
      is_read: 0,
      created_at: timestamp,
    },
    {
      id: randomUUID(),
      user_id: 'usr_dean_001',
      title: 'Karar bekleyen onay',
      message: 'Yüksek tutarlı talepler için yeni kararlar sizi bekliyor.',
      type: 'danger',
      link: '/approvals',
      is_read: 0,
      created_at: timestamp,
    },
  ].forEach((notification) => insertNotification.run(notification));
};

export const initializeDatabase = () => {
  createSchema();
  seedUsers();
  seedReferenceData();
  seedProjectsAndBudgetLines();
  seedApprovalRules();
  seedRequests();
  seedNotifications();
};
