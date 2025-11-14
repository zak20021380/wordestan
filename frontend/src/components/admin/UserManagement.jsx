import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Wallet,
  TrendingUp,
  Sparkles,
  CalendarClock,
  ArrowUpRight,
  Coins,
  TrendingDown
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { formatToman } from '../../utils/currency';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'level', label: 'Highest level' },
  { value: 'highestSpend', label: 'Highest spenders' },
  { value: 'lowestSpend', label: 'Lowest spenders' },
  { value: 'name', label: 'Name A → Z' }
];

const LEVEL_FILTER_OPTIONS = [
  { value: '', label: 'همه کاربران (All users)' },
  { value: 'highest', label: 'بالاترین سطح (Highest level)' },
  { value: '1-3', label: 'سطح ۱-۳ (Level 1-3)' },
  { value: '4-6', label: 'سطح ۴-۶ (Level 4-6)' },
  { value: '7+', label: 'سطح ۷+ (Level 7+)' }
];

const PAGE_SIZE = 10;

const formatNumber = (value) => {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) {
    return '—';
  }

  return numericValue.toLocaleString('en-US');
};

const formatDate = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (error) {
    return '—';
  }
};

const formatDateTime = (value) => {
  if (!value) {
    return '—';
  }

  try {
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return '—';
  }
};

const getLevelColor = (level) => {
  const levelNum = Number(level || 1);
  if (levelNum >= 7) {
    return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30'; // Green for high levels
  } else if (levelNum >= 4) {
    return 'text-amber-400 bg-amber-500/20 border-amber-500/30'; // Yellow for mid levels
  } else {
    return 'text-rose-400 bg-rose-500/20 border-rose-500/30'; // Red for low levels
  }
};

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sort, setSort] = useState('recent');
  const [levelFilter, setLevelFilter] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalUsers: 0,
    payingUsers: 0,
    totalRevenue: 0,
    totalCoinsPurchased: 0,
    averageSpendPerPayingUser: 0
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalCount: 0,
    limit: PAGE_SIZE
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await adminService.getUsers({
          page,
          limit: PAGE_SIZE,
          sort,
          ...(debouncedSearchTerm ? { search: debouncedSearchTerm } : {}),
          ...(levelFilter ? { levelFilter } : {})
        });

        if (!isMounted) {
          return;
        }

        const data = response?.data || {};

        setUsers(data.users || []);
        setSummary({
          totalUsers: data.summary?.totalUsers || 0,
          payingUsers: data.summary?.payingUsers || 0,
          totalRevenue: data.summary?.totalRevenue || 0,
          totalCoinsPurchased: data.summary?.totalCoinsPurchased || 0,
          averageSpendPerPayingUser: data.summary?.averageSpendPerPayingUser || 0
        });
        setPagination({
          page: data.pagination?.page || page,
          totalPages: data.pagination?.totalPages || 1,
          totalCount: data.pagination?.totalCount || (data.users?.length || 0),
          limit: data.pagination?.limit || PAGE_SIZE
        });
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load users');
          setUsers([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [page, sort, debouncedSearchTerm, levelFilter]);

  const summaryCards = useMemo(() => ([
    {
      title: 'Registered players',
      value: formatNumber(summary.totalUsers),
      helper: `${formatNumber(pagination.totalCount || summary.totalUsers)} total accounts`,
      icon: Users,
      gradient: 'from-primary-500/30 to-primary-600/20'
    },
    {
      title: 'Paying players',
      value: formatNumber(summary.payingUsers),
      helper: summary.totalUsers
        ? `${((summary.payingUsers / Math.max(summary.totalUsers, 1)) * 100).toFixed(1)}% of players`
        : '—',
      icon: Wallet,
      gradient: 'from-emerald-500/30 to-emerald-600/20'
    },
    {
      title: 'Lifetime revenue',
      value: formatToman(summary.totalRevenue),
      helper: `${formatNumber(summary.totalCoinsPurchased)} coins sold`,
      icon: TrendingUp,
      gradient: 'from-amber-500/30 to-amber-600/20'
    },
    {
      title: 'Avg. spend per payer',
      value: formatToman(summary.averageSpendPerPayingUser),
      helper: summary.payingUsers
        ? `Across ${formatNumber(summary.payingUsers)} customers`
        : 'No purchases yet',
      icon: Sparkles,
      gradient: 'from-indigo-500/30 to-indigo-600/20'
    }
  ]), [summary, pagination.totalCount]);

  const totalPages = Math.max(pagination.totalPages || 1, 1);
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pagination.limit + (users.length ? 1 : 0);
  const endIndex = (currentPage - 1) * pagination.limit + users.length;

  const tableRows = useMemo(() => {
    if (loading) {
      return Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 items-center px-4 py-4 border-b border-white/5 last:border-none"
        >
          <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 bg-white/5 rounded animate-pulse hidden md:block" />
          <div className="h-4 bg-white/5 rounded animate-pulse hidden md:block" />
          <div className="h-4 bg-white/5 rounded animate-pulse hidden md:block" />
          <div className="h-4 bg-white/5 rounded animate-pulse hidden md:block" />
        </div>
      ));
    }

    if (!users.length) {
      return (
        <div className="text-center text-white/60 py-12">
          {debouncedSearchTerm || levelFilter
            ? 'No players match your search just yet.'
            : 'No players have registered yet.'}
        </div>
      );
    }

    return users.map((user) => {
      const InitialIcon = user.username?.[0]?.toUpperCase() || '?';
      const levelColorClass = getLevelColor(user.currentLevel);

      return (
        <div
          key={user._id || user.username}
          className="grid grid-cols-1 md:grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 items-center px-4 py-4 border-b border-white/5 last:border-none bg-glass-hover/40 hover:bg-glass-hover transition-colors rounded-xl md:rounded-none md:bg-transparent md:hover:bg-white/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/80 to-primary-400/60 text-white font-semibold flex items-center justify-center">
              {InitialIcon}
            </div>
            <div>
              <div className="flex items-center gap-2 text-white font-semibold">
                <span>{user.username}</span>
                {user.isAdmin && (
                  <span className="px-2 py-0.5 text-[11px] uppercase tracking-wide bg-white/10 border border-white/10 rounded-full text-white/80">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-white/50 text-sm">
                {user.email || 'No email on file'}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40 mt-1">
                <span className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5" />
                  {formatNumber(user.coins)} coins
                </span>
                <span className="flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {formatNumber(user.totalScore)} pts
                </span>
              </div>
            </div>
          </div>

          <div className="flex md:block items-center justify-between md:justify-start">
            <div className="text-white font-semibold">
              {formatToman(user.totalSpent)}
            </div>
            <div className="text-xs text-white/40 md:mt-1">Lifetime spend</div>
          </div>

          <div className="flex md:block items-center justify-between md:justify-start">
            <div className="text-white font-semibold">
              {formatNumber(user.totalCoinsPurchased)}
            </div>
            <div className="text-xs text-white/40 md:mt-1">Coins purchased</div>
          </div>

          <div className="flex md:block items-center justify-between md:justify-start">
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold ${levelColorClass}`}>
              <TrendingUp className="w-4 h-4" />
              <span>مرحله {user.currentLevel || 1}</span>
            </div>
            <div className="text-xs text-white/40 md:mt-1">Current level</div>
          </div>

          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2 text-white/80">
              <CalendarClock className="w-4 h-4 text-primary-300" />
              {formatDate(user.createdAt)}
            </div>
            <div className="text-xs text-white/40">
              Last purchase: {formatDateTime(user.lastPurchaseAt)}
            </div>
          </div>
        </div>
      );
    });
  }, [users, loading, debouncedSearchTerm, levelFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">User Management</h2>
          <p className="text-white/60 max-w-2xl">
            Monitor every registered player, track their lifetime value, and understand how coin purchases fuel your community.
          </p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        {summaryCards.map(({ title, value, helper, icon: Icon, gradient }) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-glass backdrop-blur-xl border border-white/10 rounded-2xl p-5 relative overflow-hidden"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-60 pointer-events-none`} />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm uppercase tracking-widest text-white/50 mb-2">{title}</p>
                <p className="text-2xl font-semibold text-white">{value}</p>
              </div>
              <div className="p-3 bg-black/20 rounded-xl border border-white/10 text-white">
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <p className="relative mt-3 text-sm text-white/60">{helper}</p>
          </motion.div>
        ))}
      </motion.div>

      <div className="bg-glass backdrop-blur-xl rounded-2xl border border-glass-border p-6 space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search players by username or email..."
                  className="w-full pl-12 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-primary-400 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-white/50">Sort by</label>
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setPage(1);
                }}
                className="bg-black/40 border border-white/10 rounded-xl text-white px-4 py-2 focus:outline-none focus:border-primary-400"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-white/50 whitespace-nowrap">Filter by level</label>
            <select
              value={levelFilter}
              onChange={(event) => {
                setLevelFilter(event.target.value);
                setPage(1);
              }}
              className="bg-black/40 border border-white/10 rounded-xl text-white px-4 py-2 focus:outline-none focus:border-primary-400 flex-1 lg:flex-initial"
            >
              {LEVEL_FILTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value} className="bg-slate-900">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-danger/10 border border-danger/40 text-danger px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <div className="hidden md:grid grid-cols-[2fr,1fr,1fr,1fr,1fr] gap-4 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/40 bg-white/5">
            <span>Player</span>
            <span>Spend</span>
            <span>Coins purchased</span>
            <span>سطح فعلی</span>
            <span>Registration</span>
          </div>
          <div className="divide-y divide-white/5">
            {tableRows}
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm text-white/60">
          <div>
            {users.length > 0 && (
              <span>
                Showing {startIndex}-{endIndex} of {formatNumber(pagination.totalCount)} players
              </span>
            )}
            {users.length === 0 && !loading && (
              <span>Showing 0 results</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={currentPage === 1 || loading}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <div className="px-4 py-2 rounded-xl border border-white/10 text-white/70">
              Page {currentPage} of {totalPages}
            </div>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
              disabled={currentPage === totalPages || loading}
              className="px-4 py-2 rounded-xl border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
