import React, { useState } from 'react';
import {
  X,
  Plus,
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
} from 'lucide-react';
import { Category } from '../types/finance';

interface CategoryManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (data: {
    name: string;
    parentId?: string | null;
    icon: string;
    color: string;
    type: 'expense' | 'income';
  }) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Home', icon: Home },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'Zap', icon: Zap },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Baby', icon: Baby },
  { name: 'Car', icon: Car },
  { name: 'Fuel', icon: Fuel },
  { name: 'Coffee', icon: Coffee },
  { name: 'Utensils', icon: Utensils },
  { name: 'HeartPulse', icon: HeartPulse },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Landmark', icon: Landmark },
  { name: 'Film', icon: Film },
  { name: 'Plane', icon: Plane },
  { name: 'Gift', icon: Gift },
  { name: 'Shield', icon: Shield },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Tag', icon: Tag },
];

const CUSTOM_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#64748B', // Slate
];

export const CategoryManageModal: React.FC<CategoryManageModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [activeType, setActiveType] = useState<'expense' | 'income'>('expense');
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>('none');
  const [selectedIcon, setSelectedIcon] = useState('Tag');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  if (!isOpen) return null;

  const currentCategories = categories.filter((c) => c.type === activeType);
  const parentCategories = currentCategories.filter((c) => !c.parentId);

  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    onAddCategory({
      name: newCatName.trim(),
      parentId: selectedParentId === 'none' ? null : selectedParentId,
      icon: selectedIcon,
      color: selectedColor,
      type: activeType,
    });

    setNewCatName('');
    setIsAdding(false);
  };

  const renderIconComponent = (iconName: string) => {
    const found = AVAILABLE_ICONS.find((i) => i.name === iconName);
    const IconComp = found ? found.icon : Tag;
    return <IconComp className="w-4 h-4" />;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 leading-tight">
              Kelola Kategori & Sub-Kategori
            </h3>
            <p className="text-[11px] text-slate-500">
              Pemasukan dan Pengeluaran dibedakan secara terpisah sesuai Mind Map
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Pemasukan vs Pengeluaran */}
        <div className="flex p-1.5 mx-6 mt-4 bg-slate-100 rounded-xl">
          <button
            onClick={() => {
              setActiveType('expense');
              setIsAdding(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeType === 'expense'
                ? 'bg-white text-rose-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kategori Pengeluaran
          </button>
          <button
            onClick={() => {
              setActiveType('income');
              setIsAdding(false);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeType === 'income'
                ? 'bg-white text-emerald-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kategori Pemasukan
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {!isAdding ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">
                  Daftar Kategori Utama & Sub-Kategori ({parentCategories.length} Utama)
                </span>
                <button
                  onClick={() => setIsAdding(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Kategori</span>
                </button>
              </div>

              {/* Hierarchy Tree list */}
              <div className="space-y-3">
                {parentCategories.map((parent) => {
                  const subCategories = currentCategories.filter((c) => c.parentId === parent.id);

                  return (
                    <div
                      key={parent.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-2.5"
                    >
                      {/* Parent header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-2xs"
                            style={{ backgroundColor: parent.color }}
                          >
                            {renderIconComponent(parent.icon)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900">{parent.name}</span>
                            <div className="text-[10px] text-slate-400">Kategori Utama</div>
                          </div>
                        </div>

                        <button
                          onClick={() => onDeleteCategory(parent.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus Kategori Utama"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Sub-categories */}
                      {subCategories.length > 0 && (
                        <div className="pl-6 space-y-1.5 border-l-2 border-slate-200 ml-3">
                          {subCategories.map((sub) => (
                            <div
                              key={sub.id}
                              className="p-2 rounded-xl bg-white border border-slate-100 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                                  style={{ backgroundColor: sub.color }}
                                >
                                  {renderIconComponent(sub.icon)}
                                </div>
                                <span className="text-xs font-medium text-slate-700">
                                  {sub.name}
                                </span>
                              </div>
                              <button
                                onClick={() => onDeleteCategory(sub.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Tambah Kategori / Sub-Kategori Form */
            <form onSubmit={handleSaveNew} className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-bold text-slate-900">
                  Formulir Kategori Baru ({activeType === 'expense' ? 'Pengeluaran' : 'Pemasukan'})
                </span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Kembali
                </button>
              </div>

              {/* Nama kategori */}
              <div>
                <label className="text-xs font-semibold text-slate-600">Nama Kategori</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="Misal: Servis Kendaraan, Les Musik, dsb"
                  required
                  autoFocus
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </div>

              {/* Kategori Utama atau Sub-kategori */}
              <div>
                <label className="text-xs font-semibold text-slate-600">
                  Jenis Tingkatan Kategori
                </label>
                <select
                  value={selectedParentId}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl border border-slate-200 bg-white"
                >
                  <option value="none">Sebagai Kategori Utama (Parent)</option>
                  {parentCategories.map((p) => (
                    <option key={p.id} value={p.id}>
                      Sub-kategori dari: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Background Persegi Rounded dengan Pilihan Warna Custom */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  Pilihan Warna Custom (Background Persegi Rounded)
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {CUSTOM_COLORS.map((col) => (
                    <button
                      key={col}
                      type="button"
                      onClick={() => setSelectedColor(col)}
                      className={`w-8 h-8 rounded-xl border-2 transition-transform ${
                        selectedColor === col ? 'scale-110 border-slate-900' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: col }}
                    />
                  ))}
                </div>
              </div>

              {/* Pilihan Macam-macam Icon */}
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">
                  Pilihan Macam-Macam Icon
                </label>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 max-h-36 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    const isSelected = selectedIcon === item.name;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setSelectedIcon(item.name)}
                        className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                        title={item.name}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tombol Batal & Simpan */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-xs"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
