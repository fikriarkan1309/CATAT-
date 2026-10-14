import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Tag,
  Home,
  ShoppingBag,
  Zap,
  GraduationCap,
  BookOpen,
  Baby,
  Car,
  Fuel,
  Coffee,
  Utensils,
  HeartPulse,
  Briefcase,
  TrendingUp,
  Landmark,
  Film,
  Plane,
  Gift,
  Shield,
  Smartphone,
  Wallet,
  CreditCard,
  Music,
  Sparkles,
  Award,
  Compass,
  X,
  Check,
  Layers,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import { Category } from '../types/finance';

interface CategoryManagementViewProps {
  categories: Category[];
  onAddCategory: (data: {
    name: string;
    parentId?: string | null;
    icon: string;
    color: string;
    type: 'expense' | 'income';
  }) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  externalOpenAdd?: boolean;
  onResetExternalOpenAdd?: () => void;
}

const AVAILABLE_ICONS = [
  { name: 'Home', label: 'Rumah', icon: Home },
  { name: 'ShoppingBag', label: 'Belanja', icon: ShoppingBag },
  { name: 'Utensils', label: 'Makan', icon: Utensils },
  { name: 'Coffee', label: 'Kafe / Kopi', icon: Coffee },
  { name: 'Zap', label: 'Listrik / Air', icon: Zap },
  { name: 'GraduationCap', label: 'Pendidikan', icon: GraduationCap },
  { name: 'BookOpen', label: 'Buku / Kursus', icon: BookOpen },
  { name: 'Baby', label: 'Anak / Bayi', icon: Baby },
  { name: 'Car', label: 'Kendaraan', icon: Car },
  { name: 'Fuel', label: 'Bensin / BBM', icon: Fuel },
  { name: 'HeartPulse', label: 'Kesehatan', icon: HeartPulse },
  { name: 'Briefcase', label: 'Gaji / Kerja', icon: Briefcase },
  { name: 'TrendingUp', label: 'Investasi / Bisnis', icon: TrendingUp },
  { name: 'Landmark', label: 'Bank / Dividen', icon: Landmark },
  { name: 'Film', label: 'Hiburan', icon: Film },
  { name: 'Plane', label: 'Liburan', icon: Plane },
  { name: 'Gift', label: 'Hadiah', icon: Gift },
  { name: 'Shield', label: 'Asuransi', icon: Shield },
  { name: 'Smartphone', label: 'Pulsa / Kuota', icon: Smartphone },
  { name: 'Wallet', label: 'Dompet', icon: Wallet },
  { name: 'CreditCard', label: 'Kartu', icon: CreditCard },
  { name: 'Music', label: 'Musik', icon: Music },
  { name: 'Sparkles', label: 'Personal', icon: Sparkles },
  { name: 'Award', label: 'Prestasi', icon: Award },
  { name: 'Compass', label: 'Lainnya', icon: Compass },
  { name: 'Tag', label: 'Label', icon: Tag },
];

const PALETTE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
  '#475569', // Slate
  '#84CC16', // Lime
];

export const CategoryManagementView: React.FC<CategoryManagementViewProps> = ({
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  externalOpenAdd,
  onResetExternalOpenAdd,
}) => {
  // Tab Jenis: 'expense' (Pengeluaran) | 'income' (Pemasukan)
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');

  // Modal State Tambah / Edit Kategori
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [formParentId, setFormParentId] = useState<string>('none');
  const [formIcon, setFormIcon] = useState('ShoppingBag');
  const [formColor, setFormColor] = useState('#EF4444');

  // Modal Konfirmasi Hapus
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Accordion state
  const [expandedParentIds, setExpandedParentIds] = useState<Record<string, boolean>>({});

  const toggleParentExpand = (parentId: string) => {
    setExpandedParentIds((prev) => ({
      ...prev,
      [parentId]: !prev[parentId],
    }));
  };

  const currentCategories = categories.filter((c) => c.type === activeTab);
  const parentCategories = currentCategories.filter((c) => !c.parentId);
  const totalSubCategories = currentCategories.filter((c) => Boolean(c.parentId)).length;

  const renderIconComponent = (iconName: string, className = 'w-5 h-5') => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Tag;
    return <IconComp className={className} />;
  };

  const handleOpenAdd = (prefillParentId?: string) => {
    if (prefillParentId) {
      setExpandedParentIds((prev) => ({ ...prev, [prefillParentId]: true }));
    }
    setEditingCategory(null);
    setFormName('');
    setFormType(activeTab);
    setFormParentId(prefillParentId || 'none');
    setFormIcon(activeTab === 'expense' ? 'ShoppingBag' : 'Briefcase');
    setFormColor(activeTab === 'expense' ? '#EF4444' : '#10B981');
    setIsFormModalOpen(true);
  };

  React.useEffect(() => {
    if (externalOpenAdd) {
      handleOpenAdd();
      if (onResetExternalOpenAdd) {
        onResetExternalOpenAdd();
      }
    }
  }, [externalOpenAdd]);

  const handleOpenEdit = (category: Category) => {
    setEditingCategory(category);
    setFormName(category.name);
    setFormType(category.type);
    setFormParentId(category.parentId || 'none');
    setFormIcon(category.icon);
    setFormColor(category.color);
    setIsFormModalOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const parentIdValue = formParentId === 'none' ? null : formParentId;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        name: formName.trim(),
        parentId: parentIdValue,
        icon: formIcon,
        color: formColor,
        type: formType,
      });
    } else {
      onAddCategory({
        name: formName.trim(),
        parentId: parentIdValue,
        icon: formIcon,
        color: formColor,
        type: formType,
      });
    }

    setIsFormModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      onDeleteCategory(categoryToDelete.id);
      setCategoryToDelete(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 w-full overflow-hidden">
      {/* 1. SEGMENTED SWITCHER: PENGELUARAN VS PEMASUKAN */}
      <div className="bg-slate-200/80 dark:bg-slate-800 p-1.5 rounded-2xl flex items-center gap-1.5 shadow-2xs">
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'expense'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activeTab === 'expense' ? 'bg-rose-500' : 'bg-slate-400 dark:bg-slate-600'
            }`}
          />
          <span>Pengeluaran</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
              activeTab === 'expense'
                ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400'
                : 'bg-slate-300/60 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {categories.filter((c) => c.type === 'expense').length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'income'
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              activeTab === 'income' ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'
            }`}
          />
          <span>Pemasukan</span>
          <span
            className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-bold ${
              activeTab === 'income'
                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                : 'bg-slate-300/60 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}
          >
            {categories.filter((c) => c.type === 'income').length}
          </span>
        </button>
      </div>

      {/* 2. SUB-BAR INFO */}
      <div className="flex items-center justify-between px-1.5 py-1">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <Layers className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          <span>
            {parentCategories.length} Kategori Utama · {totalSubCategories} Sub-Kategori
          </span>
        </div>
      </div>

      {/* 3. DAFTAR KATEGORI UTAMA & SUB-KATEGORI */}
      {parentCategories.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 p-10 text-center shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center">
            <Tag className="w-6 h-6" />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Belum ada kategori {activeTab === 'expense' ? 'pengeluaran' : 'pemasukan'} yang tercatat.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {parentCategories.map((parent) => {
            const subCategories = currentCategories.filter((c) => c.parentId === parent.id);
            const isExpanded = Boolean(expandedParentIds[parent.id]);

            return (
              <div
                key={parent.id}
                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden transition-all hover:shadow-xs"
              >
                {/* Baris Kategori Utama */}
                <div
                  onClick={() => toggleParentExpand(parent.id)}
                  className="p-3.5 sm:p-4.5 flex items-center justify-between bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors gap-3 cursor-pointer select-none"
                >
                  {/* Sisi Kiri: Ikon Kategori, Nama, Chevron & Jumlah Sub */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div
                      className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                      style={{ backgroundColor: parent.color }}
                    >
                      {renderIconComponent(parent.icon, 'w-5 h-5 sm:w-6 sm:h-6')}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug truncate">
                          {parent.name}
                        </span>
                        {subCategories.length > 0 && (
                          <ChevronDown
                            className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
                              isExpanded ? 'rotate-180 text-blue-600 dark:text-blue-400' : ''
                            }`}
                          />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                          Kategori Utama
                        </span>
                        <span className="text-slate-300 dark:text-slate-600">·</span>
                        <span className={subCategories.length > 0 ? (isExpanded ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium') : 'text-slate-400 dark:text-slate-500'}>
                          {subCategories.length > 0
                            ? `${subCategories.length} Sub-Kategori ${isExpanded ? '(Klik untuk tutup)' : '(Klik untuk buka)'}`
                            : '0 Sub-Kategori'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sisi Kanan: Aksi Tambah Sub, Edit, Hapus */}
                  <div
                    className="flex items-center gap-1 sm:gap-1.5 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleOpenAdd(parent.id)}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      title="Tambah Sub-Kategori"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span className="hidden sm:inline">Sub-Kategori</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(parent)}
                      className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                      title="Edit Kategori Utama"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCategoryToDelete(parent)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                      title="Hapus Kategori Utama"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Sub-Kategori List */}
                {isExpanded && subCategories.length > 0 && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 animate-in fade-in duration-150">
                    {subCategories.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-3 sm:p-3.5 pl-6 sm:pl-7 flex items-center justify-between hover:bg-slate-100/70 dark:hover:bg-slate-800/80 transition-colors group gap-2"
                      >
                        {/* Kiri: Ikon Sub-kategori & Nama */}
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: sub.color }}
                          >
                            {renderIconComponent(sub.icon, 'w-4 h-4')}
                          </div>
                          <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {sub.name}
                          </span>
                        </div>

                        {/* Kanan: Edit & Hapus */}
                        <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"
                            title="Edit Sub-Kategori"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => setCategoryToDelete(sub)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                            title="Hapus Sub-Kategori"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sub-Kategori Kosong */}
                {isExpanded && subCategories.length === 0 && (
                  <div className="p-4 text-center border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/40 text-xs text-slate-400 dark:text-slate-500">
                    Belum ada sub-kategori di kategori ini. Klik <span className="font-semibold text-slate-600 dark:text-slate-300">+ Sub-Kategori</span> untuk menambahkan.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 4. MODAL FORM: TAMBAH / EDIT KATEGORI */}
      {isFormModalOpen && (
        <div
          onClick={() => setIsFormModalOpen(false)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {formType === 'expense' ? 'Kategori Pengeluaran' : 'Kategori Pemasukan'}
                </p>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitForm} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* Live Preview Box */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-2xs shrink-0"
                  style={{ backgroundColor: formColor }}
                >
                  {renderIconComponent(formIcon, 'w-6 h-6')}
                </div>
                <div>
                  <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">Pratinjau Tampilan:</div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {formName.trim() || 'Nama Kategori'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {formParentId === 'none'
                      ? 'Kategori Utama'
                      : `Sub-kategori dari ${
                          categories.find((c) => c.id === formParentId)?.name || 'Induk'
                        }`}
                  </div>
                </div>
              </div>

              {/* Nama Kategori */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Kategori
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Misal: Belanja Sayur, Les Kenzi, dsb"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
                />
              </div>

              {/* Jenis: Pengeluaran vs Pemasukan */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Jenis Aliran Dana
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('expense');
                      setFormParentId('none');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formType === 'expense'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-400 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Pengeluaran
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('income');
                      setFormParentId('none');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      formType === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    Pemasukan
                  </button>
                </div>
              </div>

              {/* Kategori Induk */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Tingkatan Kategori
                </label>
                <select
                  value={formParentId}
                  onChange={(e) => setFormParentId(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="none">★ Sebagai Kategori Utama (Parent)</option>
                  {categories
                    .filter(
                      (c) =>
                        c.type === formType &&
                        !c.parentId &&
                        (!editingCategory || c.id !== editingCategory.id)
                    )
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        ↳ Sub-kategori dari: {p.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Pilihan Warna */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pilihan Warna Icon
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE_COLORS.map((col) => {
                    const isSelected = formColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setFormColor(col)}
                        className={`w-8 h-8 rounded-xl transition-all flex items-center justify-center text-white ${
                          isSelected
                            ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 dark:ring-white shadow-sm'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Pilihan Icon */}
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Pilihan Icon Kategori
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = formIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormIcon(item.name)}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                        title={item.label}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[9px] font-medium truncate max-w-full">
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Simpan & Batal */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {editingCategory ? 'Simpan Perubahan' : 'Buat Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. MODAL KONFIRMASI HAPUS KATEGORI */}
      {categoryToDelete && (
        <div
          onClick={() => setCategoryToDelete(null)}
          className="fixed inset-0 z-50 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Hapus Kategori?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Apakah Anda yakin ingin menghapus kategori{' '}
                <span className="font-bold text-slate-900 dark:text-white">"{categoryToDelete.name}"</span>?
                {!categoryToDelete.parentId && (
                  <span className="block mt-1 text-rose-600 dark:text-rose-400 text-[11px] font-semibold">
                    Catatan: Menghapus kategori utama juga akan menghapus sub-kategori di bawahnya.
                  </span>
                )}
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setCategoryToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
