import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, ClipboardList, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { requestService } from '../../services/requestService';
import { formatCurrency } from '../../utils/formatters';

const initialForm = {
  projectId: '',
  budgetLineId: '',
  catalogItemId: '',
  procurementMethodId: '',
  priorityId: '',
  description: '',
  quantity: 1,
  unitPrice: 0,
  justification: '',
};

const defaultReferenceData = {
  budgetCategories: [],
  procurementMethods: [],
  priorities: [],
  catalogItems: [],
};

const defaultProcurementMethodByCategory = {
  cat_service: 'method_service',
  cat_travel: 'method_travel',
};

const getDefaultProcurementMethodId = (budgetCategoryId, procurementMethods) => {
  const preferredId =
    defaultProcurementMethodByCategory[budgetCategoryId] ?? 'method_direct';

  if (procurementMethods.some((method) => method.id === preferredId)) {
    return preferredId;
  }

  return procurementMethods[0]?.id ?? '';
};

export const PurchaseRequestForm = ({
  projects,
  referenceData = defaultReferenceData,
  initialRequest = null,
}) => {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [attachment, setAttachment] = useState(null);
  const [existingAttachmentName, setExistingAttachmentName] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === form.projectId) ?? null,
    [projects, form.projectId],
  );

  const selectedBudgetLine = useMemo(
    () =>
      selectedProject?.budgetLines.find((budgetLine) => budgetLine.id === form.budgetLineId) ??
      null,
    [selectedProject, form.budgetLineId],
  );

  const availableCatalogItems = useMemo(() => {
    if (!selectedBudgetLine) {
      return [];
    }

    return referenceData.catalogItems.filter(
      (item) => item.budgetCategoryId === selectedBudgetLine.budgetCategoryId,
    );
  }, [referenceData.catalogItems, selectedBudgetLine]);

  const selectedCatalogItem = useMemo(
    () => availableCatalogItems.find((item) => item.id === form.catalogItemId) ?? null,
    [availableCatalogItems, form.catalogItemId],
  );

  const selectedProcurementMethod = useMemo(
    () =>
      referenceData.procurementMethods.find((method) => method.id === form.procurementMethodId) ??
      null,
    [referenceData.procurementMethods, form.procurementMethodId],
  );

  const selectedPriority = useMemo(
    () => referenceData.priorities.find((priority) => priority.id === form.priorityId) ?? null,
    [referenceData.priorities, form.priorityId],
  );

  const totalAmount = Number(form.quantity || 0) * Number(form.unitPrice || 0);
  const exceedsBudget =
    selectedBudgetLine && totalAmount > Number(selectedBudgetLine.availableAmount);

  useEffect(() => {
    if (!initialRequest) {
      setForm(initialForm);
      setExistingAttachmentName('');
      return;
    }

    setForm({
      projectId: initialRequest.projectId ?? '',
      budgetLineId: initialRequest.budgetLineId ?? '',
      catalogItemId: initialRequest.catalogItemId ?? '',
      procurementMethodId: initialRequest.procurementMethodId ?? '',
      priorityId: initialRequest.priorityId ?? '',
      description: initialRequest.description ?? '',
      quantity: initialRequest.quantity ?? 1,
      unitPrice: initialRequest.unitPrice ?? 0,
      justification: initialRequest.justification ?? '',
    });
    setExistingAttachmentName(initialRequest.attachmentName ?? '');
  }, [initialRequest]);

  useEffect(() => {
    if (initialRequest || form.priorityId || !referenceData.priorities.length) {
      return;
    }

    const normalPriority =
      referenceData.priorities.find((priority) => priority.id === 'priority_normal') ??
      referenceData.priorities[0];

    if (normalPriority) {
      setForm((current) => ({
        ...current,
        priorityId: normalPriority.id,
      }));
    }
  }, [form.priorityId, initialRequest, referenceData.priorities]);

  useEffect(() => {
    if (!selectedBudgetLine || initialRequest) {
      return;
    }

    const procurementMethodId = getDefaultProcurementMethodId(
      selectedBudgetLine.budgetCategoryId,
      referenceData.procurementMethods,
    );

    setForm((current) => {
      if (current.procurementMethodId === procurementMethodId) {
        return current;
      }

      return {
        ...current,
        procurementMethodId,
      };
    });
  }, [
    form.procurementMethodId,
    initialRequest,
    referenceData.procurementMethods,
    selectedBudgetLine,
  ]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    if (name === 'projectId') {
      setForm((current) => ({
        ...current,
        projectId: value,
        budgetLineId: '',
        catalogItemId: '',
        procurementMethodId: '',
      }));
      setFeedback(null);
      return;
    }

    if (name === 'budgetLineId') {
      const nextBudgetLine =
        selectedProject?.budgetLines.find((line) => line.id === value) ?? null;

      setForm((current) => ({
        ...current,
        budgetLineId: value,
        catalogItemId: '',
        procurementMethodId: nextBudgetLine
          ? getDefaultProcurementMethodId(
              nextBudgetLine.budgetCategoryId,
              referenceData.procurementMethods,
            )
          : '',
      }));
      setFeedback(null);
      return;
    }

    if (name === 'catalogItemId') {
      const nextItem = availableCatalogItems.find((item) => item.id === value) ?? null;

      setForm((current) => ({
        ...current,
        catalogItemId: value,
        unitPrice: nextItem ? nextItem.typicalUnitPrice : current.unitPrice,
      }));
      setFeedback(null);
      return;
    }

    setForm((current) => ({
      ...current,
      [name]: name === 'quantity' || name === 'unitPrice' ? Number(value) : value,
    }));
    setFeedback(null);
  };

  const handleSubmit = async (action) => {
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const payload = {
        ...form,
        attachment,
        action,
      };
      const request = initialRequest?.id
        ? await requestService.updateRequest(initialRequest.id, payload)
        : await requestService.createRequest(payload);

      setFeedback({
        type: 'success',
        message:
          action === 'draft'
            ? `${request.referenceNo ?? 'Talep'} taslak olarak kaydedildi.`
            : `${request.referenceNo ?? 'Talep'} onay sürecine gönderildi.`,
      });
      setForm(initialForm);
      setAttachment(null);
      setExistingAttachmentName('');
      window.setTimeout(() => {
        navigate('/requests');
      }, 700);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.response?.data?.message ?? error.message ?? 'Talep oluşturulamadı.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="soft-card rounded-[30px] p-6 md:p-8">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-tide">Satın alma talebi</p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-ink">
            {initialRequest ? 'Talebi güncelle' : 'Yeni talep formu'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate">
            Talep oluşturmak için projeyi ve bütçe kalemini seçerek gerekli bilgileri doldurun.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Proje</span>
            <select
              name="projectId"
              value={form.projectId}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
              aria-label="Proje seçin"
            >
              <option value="">Proje seçin</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Bütçe kalemi</span>
            <select
              name="budgetLineId"
              value={form.budgetLineId}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm disabled:bg-mist"
              aria-label="Bütçe kalemi seçin"
              disabled={!selectedProject}
            >
              <option value="">
                {selectedProject ? 'Bütçe kalemi seçin' : 'Önce proje seçin'}
              </option>
              {selectedProject?.budgetLines.map((line) => (
                <option key={line.id} value={line.id}>
                  {line.name} - {line.budgetCategoryName}
                </option>
              ))}
            </select>
            <span className="mt-2 block text-xs leading-5 text-slate">
              {selectedProject
                ? `${selectedProject.budgetLines.length} uygun bütçe kalemi bulundu.`
                : 'Seçim yapınca sadece ilgili projeye ait kalemler listelenir.'}
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Talep kalemi</span>
            <select
              name="catalogItemId"
              value={form.catalogItemId}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm disabled:bg-mist"
              aria-label="Talep kalemi seçin"
              disabled={!selectedBudgetLine}
            >
              <option value="">
                {selectedBudgetLine ? 'Katalog kalemi seçin' : 'Önce bütçe kalemi seçin'}
              </option>
              {availableCatalogItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} - {formatCurrency(item.typicalUnitPrice)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Satın alma yöntemi</span>
            <select
              name="procurementMethodId"
              value={form.procurementMethodId}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm disabled:bg-mist"
              aria-label="Satın alma yöntemi seçin"
              disabled={!selectedBudgetLine}
            >
              <option value="">Yöntem seçin</option>
              {referenceData.procurementMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Öncelik</span>
            <select
              name="priorityId"
              value={form.priorityId}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
              aria-label="Öncelik seçin"
            >
              <option value="">Öncelik seçin</option>
              {referenceData.priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name} - {priority.slaDays} gün
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Birim</span>
            <input
              className="w-full rounded-2xl border border-ink/10 bg-mist px-4 py-3 text-sm text-slate"
              value={selectedCatalogItem?.unit ?? 'Katalog kalemi seçilmedi'}
              readOnly
              aria-label="Seçilen kalemin birimi"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Miktar</span>
            <input
              type="number"
              min="1"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-ink">Birim fiyat (TL)</span>
            <input
              type="number"
              min="1"
              step="50"
              name="unitPrice"
              value={form.unitPrice}
              onChange={handleChange}
              className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
            />
            {selectedCatalogItem ? (
              <span className="mt-2 block text-xs leading-5 text-slate">
                Katalog önerisi: {formatCurrency(selectedCatalogItem.typicalUnitPrice)}
              </span>
            ) : null}
          </label>
        </div>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-ink">Kısa açıklama</span>
          <input
            className="focus-ring w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Örn. deney hazırlık takvimi nedeniyle hızlı tedarik ihtiyacı"
          />
        </label>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-ink">Gerekçe</span>
          <textarea
            name="justification"
            value={form.justification}
            onChange={handleChange}
            rows="5"
            className="focus-ring w-full rounded-3xl border border-ink/10 bg-white px-4 py-3 text-sm"
            placeholder="Harcamayı proje hedefiyle, deney takvimiyle veya çıktıyla ilişkilendirin"
          />
        </label>

        <label className="mt-5 block">
          <span className="mb-2 block text-sm font-medium text-ink">Destek belgesi</span>
          <div className="rounded-[24px] border border-dashed border-ink/15 bg-mist px-4 py-5">
            <div className="flex items-center gap-3 text-sm text-slate">
              <UploadCloud className="size-5 text-tide" />
              <span>Yüklenen dosya doğrudan talep kaydına eklenir.</span>
            </div>
            <input
              type="file"
              onChange={(event) => setAttachment(event.target.files?.[0] ?? null)}
              className="focus-ring mt-4 block w-full rounded-2xl border border-ink/10 bg-white px-4 py-3 text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-ink file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              aria-label="Destek belgesi seçin"
            />
            {attachment ? <p className="mt-3 text-sm text-ink">{attachment.name}</p> : null}
            {!attachment && existingAttachmentName ? (
              <p className="mt-3 text-sm text-ink">Mevcut dosya: {existingAttachmentName}</p>
            ) : null}
          </div>
        </label>

        {feedback ? (
          <div
            className={`mt-6 flex items-start gap-3 rounded-2xl px-4 py-3 text-sm ${
              feedback.type === 'success'
                ? 'bg-success/10 text-success'
                : 'bg-danger/10 text-danger'
            }`}
            role="alert"
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="mt-0.5 size-5" />
            ) : (
              <AlertCircle className="mt-0.5 size-5" />
            )}
            <span>{feedback.message}</span>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="focus-ring rounded-2xl border border-ink/10 bg-white px-5 py-3 text-sm font-semibold text-ink"
          >
            {initialRequest ? 'Taslağı güncelle' : 'Taslak kaydet'}
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('submit')}
            disabled={
              isSubmitting ||
              exceedsBudget ||
              !form.projectId ||
              !form.budgetLineId ||
              !form.catalogItemId ||
              !form.procurementMethodId ||
              !form.priorityId
            }
            className="focus-ring rounded-2xl bg-ink px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-ink/30"
          >
            Onaya gönder
          </button>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="soft-card rounded-[28px] p-6">
          <p className="text-xs uppercase tracking-[0.22em] text-coral">Canlı özet</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate">Toplam tutar</p>
              <p className="mt-2 font-display text-3xl font-semibold text-ink">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate">Seçilen kalem bakiyesi</p>
              <p className="mt-2 font-semibold text-ink">
                {selectedBudgetLine
                  ? formatCurrency(selectedBudgetLine.availableAmount)
                  : 'Bütçe kalemi seçilmedi'}
              </p>
            </div>
            <div className="rounded-2xl bg-mist p-4">
              <p className="text-sm text-slate">Öncelik ve SLA</p>
              <p className="mt-2 font-semibold text-ink">
                {selectedPriority
                  ? `${selectedPriority.name} - ${selectedPriority.slaDays} gün`
                  : 'Öncelik seçilmedi'}
              </p>
            </div>
          </div>
        </section>

        <section
          className={`rounded-[28px] p-6 ${
            exceedsBudget ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
          }`}
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            {exceedsBudget ? (
              <AlertCircle className="mt-0.5 size-5" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-5" />
            )}
            <div>
              <p className="font-semibold">
                {exceedsBudget ? 'Bakiye aşımı var' : 'Talep bakiyeye uygun'}
              </p>
              <p className="mt-2 text-sm leading-6">
                {selectedBudgetLine
                  ? exceedsBudget
                    ? 'Girilen tutar seçilen bütçe kaleminin kullanılabilir bakiyesini aşmaktadır.'
                    : 'Talep tutarı seçilen bütçe kaleminin bakiyesi dahilindedir.'
                  : 'Lütfen bütçe kalemi seçiniz.'}
              </p>
            </div>
          </div>
        </section>

        <section className="soft-card rounded-[28px] p-6">
          <div className="flex items-start gap-3">
            <ClipboardList className="mt-1 size-5 text-tide" />
            <div>
              <p className="font-semibold text-ink">Belge kontrol listesi</p>
              <p className="mt-2 text-sm leading-6 text-slate">
                {selectedBudgetLine
                  ? `${selectedBudgetLine.budgetCategoryName} için gerekli görülen belgeler aşağıda listelenir.`
                  : 'Bütçe kalemi seçtiğinizde ilgili kategori için istenen belgeler görünecek.'}
              </p>
            </div>
          </div>
          {selectedBudgetLine ? (
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl bg-mist p-4">
                <p className="text-sm font-semibold text-ink">{selectedBudgetLine.budgetCategoryName}</p>
                <p className="mt-2 text-sm leading-6 text-slate">
                  {selectedBudgetLine.sourceReference}
                </p>
              </div>
              <div className="rounded-2xl border border-ink/10 bg-white p-4">
                {selectedBudgetLine.requiredDocuments.length ? (
                  <ul className="space-y-2 text-sm text-slate">
                    {selectedBudgetLine.requiredDocuments.map((document) => (
                      <li key={document} className="flex items-start gap-2">
                        <span className="mt-1 size-1.5 rounded-full bg-tide" />
                        <span>{document}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate">Bu kategori için ek belge listesi tanımlanmadı.</p>
                )}
              </div>
              {selectedProcurementMethod ? (
                <div className="rounded-2xl bg-mist p-4">
                  <p className="text-sm font-semibold text-ink">
                    Yöntem: {selectedProcurementMethod.name}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    {selectedProcurementMethod.description}
                  </p>
                </div>
              ) : null}
              {selectedCatalogItem ? (
                <div className="rounded-2xl bg-mist p-4">
                  <p className="text-sm font-semibold text-ink">{selectedCatalogItem.name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate">
                    {selectedCatalogItem.description}
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>
      </aside>
    </div>
  );
};
