export const formatCurrency = (value) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value ?? 0);

export const formatCompactNumber = (value) =>
  new Intl.NumberFormat('tr-TR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value ?? 0);

export const formatDate = (value) =>
  new Intl.DateTimeFormat('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));

export const roleLabels = {
  researcher: 'Araştırmacı',
  finance_specialist: 'Mali İşler Uzmanı',
  dean: 'Dekan',
};

export const statusStyles = {
  draft: 'bg-slate/10 text-slate',
  awaiting_finance: 'bg-warning/15 text-warning',
  awaiting_dean: 'bg-coral/15 text-coral',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/15 text-danger',
  revision_requested: 'bg-ink/10 text-ink',
};

export const statusLabels = {
  draft: 'Taslak',
  awaiting_finance: 'Mali İşler Onayı',
  awaiting_dean: 'Dekan Onayı',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  revision_requested: 'Revizyon İstendi',
};
