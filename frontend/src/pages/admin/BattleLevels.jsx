import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, RefreshCcw, Search } from 'lucide-react';
import { battleLevelsService } from '../../services/battleLevelsService';
import BattleLevelCard from '../../components/Admin/BattleLevelCard';
import BattleLevelForm from '../../components/Admin/BattleLevelForm';

const statusOptions = [
  { value: '', label: 'همه وضعیت‌ها' },
  { value: 'active', label: 'فعال' },
  { value: 'inactive', label: 'غیرفعال' },
];

const BattleLevels = () => {
  const [levels, setLevels] = useState([]);
  const [stats, setStats] = useState(null);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0, limit: 12 });
  const [filters, setFilters] = useState({ search: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSet, setSelectedSet] = useState(null);

  const loadLevels = async (page = meta.page) => {
    setLoading(true);
    try {
      const response = await battleLevelsService.list({
        page,
        search: filters.search || undefined,
        status: filters.status || undefined,
      });
      setLevels(response.items || []);
      setStats(response.stats || {});
      setMeta(response.meta || { page: 1, pages: 1, total: 0, limit: 12 });
    } catch (error) {
      toast.error(error.message || 'بارگذاری مرحله‌ها ناموفق بود');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLevels(1);
    }, 250);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.search]);

  const handleSearch = (event) => {
    setFilters((prev) => ({ ...prev, search: event.target.value }));
  };

  const handleSubmitForm = async (payload) => {
    try {
      if (selectedSet) {
        await battleLevelsService.update(selectedSet._id, payload);
        toast.success('مرحله بروزرسانی شد');
      } else {
        await battleLevelsService.create(payload);
        toast.success('مرحله جدید ساخته شد');
      }
      setFormOpen(false);
      setSelectedSet(null);
      loadLevels();
    } catch (error) {
      toast.error(error.message || 'ذخیره مرحله ناموفق بود');
    }
  };

  const handleDelete = async (level) => {
    if (!window.confirm(`حذف ${level.name}؟`)) {
      return;
    }
    try {
      await battleLevelsService.remove(level._id);
      toast.success('مرحله حذف شد');
      loadLevels();
    } catch (error) {
      toast.error(error.message || 'حذف مرحله ممکن نشد');
    }
  };

  const handleToggleActive = async (level) => {
    try {
      await battleLevelsService.update(level._id, { isActive: !level.isActive });
      toast.success('وضعیت مرحله بروزرسانی شد');
      loadLevels(meta.page);
    } catch (error) {
      toast.error(error.message || 'تغییر وضعیت ناموفق بود');
    }
  };

  const statCards = useMemo(() => (
    [
      { label: 'کل مرحله‌های نبرد', value: stats?.totalLevels || 0 },
      { label: 'مرحله‌های فعال', value: stats?.activeLevels || 0 },
      { label: 'کل کلمات', value: stats?.totalWords || 0 },
      {
        label: 'پرمصرف‌ترین مرحله',
        value: stats?.mostUsedLevel?.name || '---',
        description: stats?.mostUsedLevel ? `${stats.mostUsedLevel.usageCount} بار استفاده` : '',
      },
    ]
  ), [stats]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-white/60">مرحله‌های اختصاصی حالت نبرد</p>
          <h2 className="text-3xl font-black text-white">مدیریت مرحله‌های نبرد ⚔️</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedSet(null);
              setFormOpen(true);
            }}
            className="flex items-center gap-2 rounded-2xl bg-primary-500/80 px-4 py-2 text-white"
          >
            <Plus className="w-4 h-4" /> مرحله نبرد جدید
          </button>
          <button
            type="button"
            onClick={() => loadLevels(meta.page)}
            className="flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-white/80"
          >
            <RefreshCcw className="w-4 h-4" /> بروزرسانی
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((item) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-4 text-white">
            <p className="text-sm text-white/60">{item.label}</p>
            <p className="text-2xl font-bold mt-1">{item.value}</p>
            {item.description && <p className="text-xs text-white/50 mt-1">{item.description}</p>}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="col-span-2 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3">
            <Search className="w-4 h-4 text-white/50" />
            <input
              value={filters.search}
              onChange={handleSearch}
              placeholder="جستجو در نام مرحله یا کلمات"
              className="flex-1 bg-transparent py-2 text-sm text-white focus:outline-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/70">
          در حال بارگذاری...
        </div>
      ) : levels.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/20 p-6 text-center text-white/60">
          مرحله‌ای برای نمایش وجود ندارد.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {levels.map((level) => (
            <div key={level._id} className="space-y-2">
              <BattleLevelCard
                level={level}
                onEdit={(set) => {
                  setSelectedSet(set);
                  setFormOpen(true);
                }}
                onDelete={handleDelete}
                onToggleActive={handleToggleActive}
              />
            </div>
          ))}
        </div>
      )}

      <BattleLevelForm
        open={formOpen}
        initialValue={selectedSet}
        onClose={() => {
          setFormOpen(false);
          setSelectedSet(null);
        }}
        onSubmit={handleSubmitForm}
      />

    </div>
  );
};

export default BattleLevels;
