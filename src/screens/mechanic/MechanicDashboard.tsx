import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Dimensions,
} from "react-native";
import { AppLoaderModal } from "../../components/common/AppLoaderModal";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuthStore } from "../../stores/authStore";
import { useNotificationStore } from "../../stores/notificationStore";
import { useDrawer } from "../../components/CustomDrawer";
import { jobcardApi, HanaJobCard } from "../../api/jobcardApi";
import { EmptyState } from "../../components/common/EmptyState";
import { COLORS, SPACING, SHADOW } from "../../config/theme";

const { width: SW } = Dimensions.get("window");

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIMARY = "#4F46E5"; // indigo (matches drawer)
const PRIMARY_D = "#3730A3"; // dark indigo
const DARK = "#0F172A"; // slate-900
const SURFACE = "#FFFFFF";
const BG = "#F1F5F9"; // cool gray background

const STATUS_CFG: Record<
  string,
  { label: string; color: string; bg: string; icon: string }
> = {
  open: {
    label: "New",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: "clipboard-outline",
  },
  assigned: {
    label: "Assigned",
    color: "#3B82F6",
    bg: "#EFF6FF",
    icon: "clipboard-outline",
  },
  in_progress: {
    label: "In Progress",
    color: "#7C3AED",
    bg: "#F5F3FF",
    icon: "play-circle-outline",
  },
  awaiting_approval: {
    label: "Pending Approval",
    color: "#D97706",
    bg: "#FFFBEB",
    icon: "time-outline",
  },
  approved_for_invoice: {
    label: "Approved",
    color: "#059669",
    bg: "#ECFDF5",
    icon: "checkmark-circle-outline",
  },
  revision_requested: {
    label: "Needs Revision",
    color: "#DC2626",
    bg: "#FEF2F2",
    icon: "refresh-circle-outline",
  },
  completed: {
    label: "Completed",
    color: "#059669",
    bg: "#ECFDF5",
    icon: "checkmark-done-outline",
  },
  cancelled: {
    label: "Cancelled",
    color: "#6B7280",
    bg: "#F9FAFB",
    icon: "close-circle-outline",
  },
};

const ACTIVE_STATUSES = new Set([
  "open",
  "assigned",
  "in_progress",
  "awaiting_approval",
  "approved_for_invoice",
  "revision_requested",
]);

const getInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const formatDate = (iso?: string) => {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
};

// ─── Status Pill ──────────────────────────────────────────────────────────────

const StatusPill: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CFG[status] ?? {
    label: status,
    color: "#6B7280",
    bg: "#F9FAFB",
    icon: "ellipse-outline",
  };
  return (
    <View
      style={[
        pill.wrap,
        { backgroundColor: cfg.bg, borderColor: cfg.color + "40" },
      ]}
    >
      <View style={[pill.dot, { backgroundColor: cfg.color }]} />
      <Text style={[pill.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};
const pill = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 10, fontWeight: "700" },
});

// ─── Stat Cards (2 × 3 grid) ─────────────────────────────────────────────────

const STAT_CARDS = [
  {
    key: "assigned",
    label: "Assigned",
    icon: "clipboard-outline",
    color: "#3B82F6",
    bg: "#EFF6FF",
  },
  {
    key: "progress",
    label: "In Progress",
    icon: "play-circle-outline",
    color: "#7C3AED",
    bg: "#F5F3FF",
  },
  {
    key: "pending",
    label: "Awaiting",
    icon: "time-outline",
    color: "#D97706",
    bg: "#FFFBEB",
  },
  {
    key: "revision",
    label: "Revision",
    icon: "refresh-circle-outline",
    color: "#DC2626",
    bg: "#FEF2F2",
  },
  {
    key: "completed",
    label: "Completed",
    icon: "checkmark-done-outline",
    color: "#059669",
    bg: "#ECFDF5",
  },
];

const CARD_W = (SW - SPACING.md * 2 - 10) / 2;

const StatTile: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: string;
  bg: string;
}> = ({ label, value, icon, color, bg }) => (
  <View style={[st.tile, { width: CARD_W }]}>
    <View
      style={[
        st.iconRing,
        { backgroundColor: color + "18", borderColor: color + "30" },
      ]}
    >
      <Ionicons name={icon as any} size={22} color={color} />
    </View>
    <Text style={[st.val, { color: DARK }]}>{value}</Text>
    <Text style={st.lbl}>{label}</Text>
    <View style={[st.bar, { backgroundColor: color + "20" }]}>
      <View
        style={[
          st.barFill,
          { backgroundColor: color, width: value > 0 ? "70%" : "0%" },
        ]}
      />
    </View>
  </View>
);
const st = StyleSheet.create({
  tile: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    padding: 16,
    gap: 6,
    ...SHADOW.sm,
  },
  iconRing: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 2,
  },
  val: { fontSize: 30, fontWeight: "800", lineHeight: 34 },
  lbl: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "600" },
  bar: { height: 4, borderRadius: 4, overflow: "hidden", marginTop: 4 },
  barFill: { height: "100%", borderRadius: 4 },
});

// ─── Job Card ─────────────────────────────────────────────────────────────────

const JobCard: React.FC<{
  job: HanaJobCard;
  navigation: any;
  onStatusChange: React.Dispatch<React.SetStateAction<HanaJobCard[]>>;
}> = ({ job, navigation, onStatusChange }) => {
  const [starting, setStarting] = useState(false);
  const cfg = STATUS_CFG[job.status] ?? STATUS_CFG.assigned;
  const isAssigned = job.status === "assigned" || job.status === "open";
  const isPending = job.status === "awaiting_approval";
  const isRevision = job.status === "revision_requested";
  const isApproved = job.status === "approved_for_invoice";
  const isActive = job.status === "in_progress";

  const handleStart = async () => {
    setStarting(true);
    try {
      await jobcardApi.updateStatus(job._id, "in_progress");
      onStatusChange((prev) =>
        prev.map((j) =>
          j._id === job._id ? { ...j, status: "in_progress" } : j,
        ),
      );
    } catch {
      /* silent */
    } finally {
      setStarting(false);
    }
  };

  return (
    <TouchableOpacity
      style={jc.card}
      onPress={() => navigation.navigate("HanaJobCardDetail", { id: job._id })}
      activeOpacity={0.88}
    >
      {/* Colored top strip */}
      <View style={[jc.topStrip, { backgroundColor: cfg.color }]}>
        <View style={jc.stripLeft}>
          <Text style={jc.stripId}>#{job._id.slice(-6).toUpperCase()}</Text>
          {job.createdAt && (
            <View style={jc.stripDate}>
              <Ionicons
                name="calendar-outline"
                size={10}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={jc.stripDateText}>{formatDate(job.createdAt)}</Text>
            </View>
          )}
        </View>
        <StatusPill status={job.status} />
      </View>

      {/* Body */}
      <View style={jc.body}>
        {/* Vehicle row */}
        <View style={jc.vehicleRow}>
          <View style={[jc.vehicleIcon, { backgroundColor: cfg.color + "15" }]}>
            <Ionicons name="car-sport-outline" size={20} color={cfg.color} />
          </View>
          <View style={jc.vehicleInfo}>
            <Text style={jc.plate}>{job.registrationNumber ?? "—"}</Text>
            <Text style={jc.vehicleName}>
              {[job.brand, job.model].filter(Boolean).join(" ") ||
                "Unknown vehicle"}
            </Text>
          </View>
        </View>

        {/* Work type */}
        {job.workType && (
          <View style={jc.workRow}>
            <Ionicons
              name="construct-outline"
              size={13}
              color={COLORS.textMuted}
            />
            <Text style={jc.workText} numberOfLines={1}>
              {job.workType}
            </Text>
          </View>
        )}

        {/* Alert banners */}
        {isRevision && (
          <View
            style={[
              jc.banner,
              { backgroundColor: "#FEF2F2", borderColor: "#FECACA" },
            ]}
          >
            <Ionicons name="alert-circle" size={14} color="#DC2626" />
            <Text style={[jc.bannerText, { color: "#991B1B" }]}>
              Revision needed — update estimate
            </Text>
          </View>
        )}
        {isPending && (
          <View
            style={[
              jc.banner,
              { backgroundColor: "#FFFBEB", borderColor: "#FDE68A" },
            ]}
          >
            <Ionicons name="time" size={14} color="#D97706" />
            <Text style={[jc.bannerText, { color: "#92400E" }]}>
              Waiting for owner approval
            </Text>
          </View>
        )}
        {isApproved && (
          <View
            style={[
              jc.banner,
              { backgroundColor: "#ECFDF5", borderColor: "#6EE7B7" },
            ]}
          >
            <Ionicons name="checkmark-circle" size={14} color="#059669" />
            <Text style={[jc.bannerText, { color: "#065F46" }]}>
              Approved — ready for invoice
            </Text>
          </View>
        )}
        {isActive && (
          <View
            style={[
              jc.banner,
              { backgroundColor: "#F5F3FF", borderColor: "#C4B5FD" },
            ]}
          >
            <Ionicons name="flash" size={14} color="#7C3AED" />
            <Text style={[jc.bannerText, { color: "#5B21B6" }]}>
              Work in progress
            </Text>
          </View>
        )}

        {/* Action row */}
        <View style={jc.actionRow}>
          {isAssigned ? (
            <TouchableOpacity
              style={jc.startBtn}
              onPress={handleStart}
              disabled={starting}
              activeOpacity={0.85}
            >
              {starting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="play-circle" size={15} color="#fff" />
              )}
              <Text style={jc.startText}>
                {starting ? "Starting…" : "Start Work"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[jc.viewBtn, { borderColor: cfg.color + "50" }]}
              onPress={() =>
                navigation.navigate("HanaJobCardDetail", { id: job._id })
              }
              activeOpacity={0.8}
            >
              <Text style={[jc.viewText, { color: cfg.color }]}>
                View Details
              </Text>
              <Ionicons name="arrow-forward" size={13} color={cfg.color} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const jc = StyleSheet.create({
  card: {
    backgroundColor: SURFACE,
    borderRadius: 20,
    marginBottom: 12,
    overflow: "hidden",
    ...SHADOW.sm,
  },
  topStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  stripLeft: { gap: 3 },
  stripId: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.6,
  },
  stripDate: { flexDirection: "row", alignItems: "center", gap: 4 },
  stripDateText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "500",
  },
  body: { padding: 14, gap: 10 },
  vehicleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  vehicleIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: { flex: 1 },
  plate: { fontSize: 16, fontWeight: "800", color: DARK, letterSpacing: 0.6 },
  vehicleName: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  workRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  workText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: "500",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerText: { fontSize: 12, fontWeight: "600", flex: 1 },
  actionRow: { paddingTop: 4 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 11,
  },
  startText: { fontSize: 13, fontWeight: "700", color: "#fff" },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 10,
  },
  viewText: { fontSize: 13, fontWeight: "700" },
});

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  count?: number;
  onPress?: () => void;
}> = ({ title, count, onPress }) => (
  <View style={sh.row}>
    <Text style={sh.title}>{title}</Text>
    {count !== undefined && count > 0 && (
      <View style={sh.badge}>
        <Text style={sh.badgeText}>{count}</Text>
      </View>
    )}
    {onPress && (
      <TouchableOpacity style={sh.seeAll} onPress={onPress} activeOpacity={0.7}>
        <Text style={sh.seeAllText}>See all</Text>
        <Ionicons name="chevron-forward" size={13} color={PRIMARY} />
      </TouchableOpacity>
    )}
  </View>
);
const sh = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: "800", color: DARK, flex: 1 },
  badge: {
    backgroundColor: PRIMARY + "20",
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: { fontSize: 11, color: PRIMARY, fontWeight: "800" },
  seeAll: { flexDirection: "row", alignItems: "center", gap: 2 },
  seeAllText: { fontSize: 12, color: PRIMARY, fontWeight: "700" },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const MechanicDashboard: React.FC<{ navigation: any }> = ({
  navigation,
}) => {
  const { user } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const { toggleDrawer } = useDrawer();

  const [jobs, setJobs] = useState<HanaJobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await jobcardApi.getByMechanic(user?.id ?? "");
      setJobs(data);
    } catch {
      /* silent */
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load]),
  );
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const counts = {
    assigned: jobs.filter((j) => j.status === "assigned" || j.status === "open")
      .length,
    progress: jobs.filter((j) => j.status === "in_progress").length,
    pending: jobs.filter((j) => j.status === "awaiting_approval").length,
    revision: jobs.filter((j) => j.status === "revision_requested").length,
    completed: jobs.filter((j) => j.status === "completed").length,
  };

  const priorityOrder: Record<string, number> = {
    revision_requested: 0,
    in_progress: 1,
    assigned: 2,
    open: 2,
    awaiting_approval: 3,
    approved_for_invoice: 4,
  };
  const activeJobs = jobs
    .filter((j) => ACTIVE_STATUSES.has(j.status))
    .sort(
      (a, b) => (priorityOrder[a.status] ?? 9) - (priorityOrder[b.status] ?? 9),
    );

  const displayName = (user?.legalname ?? user?.name)?.trim() || "Mechanic";
  const firstName = displayName.split(" ")[0];
  const totalActive = activeJobs.length;
  const totalAll =
    counts.assigned +
    counts.progress +
    counts.pending +
    counts.revision +
    counts.completed;
  const progressPct =
    totalAll > 0 ? Math.round((counts.completed / totalAll) * 100) : 0;

  return (
    <SafeAreaView style={s.safe}>
      <AppLoaderModal
        visible={loading && jobs.length === 0}
        message="Loading your jobs…"
      />
      <StatusBar barStyle="light-content" backgroundColor={DARK} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={PRIMARY}
            colors={[PRIMARY]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ══ HEADER ══ */}
        <View style={s.header}>
          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity
              style={s.menuBtn}
              onPress={toggleDrawer}
              activeOpacity={0.8}
            >
              <Ionicons name="menu-outline" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={s.appTitle}>Mechanic Hub</Text>
            <TouchableOpacity
              style={s.menuBtn}
              onPress={() => navigation.navigate("Notifications")}
              activeOpacity={0.8}
            >
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              {unreadCount > 0 && (
                <View style={s.notifDot}>
                  <Text style={s.notifDotText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Profile + progress */}
          <View style={s.profileBlock}>
            <View style={s.profileLeft}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{getInitials(displayName)}</Text>
              </View>
              <View>
                <Text style={s.greetText}>{greeting()}</Text>
                <Text style={s.nameText}>{firstName} 👋</Text>
                <View style={s.roleChip}>
                  <View style={s.roleDot} />
                  <Text style={s.roleChipText}>Mechanic · Active</Text>
                </View>
              </View>
            </View>

            {/* Mini progress ring */}
            <View style={s.progressBlock}>
              <Text style={s.progressNum}>{progressPct}%</Text>
              <Text style={s.progressLbl}>Done</Text>
            </View>
          </View>

          {/* Progress bar */}
          <View style={s.progressBarWrap}>
            <View style={s.progressBarBg}>
              <View
                style={[s.progressBarFill, { width: `${progressPct}%` as any }]}
              />
            </View>
            <Text style={s.progressBarLabel}>
              {counts.completed} of {totalAll} jobs completed
            </Text>
          </View>
        </View>

        {/* ══ QUICK STATS ══ */}
        <View style={s.statsSection}>
          <View style={s.statsGrid}>
            {STAT_CARDS.map((c) => (
              <StatTile
                key={c.key}
                label={c.label}
                value={counts[c.key as keyof typeof counts]}
                icon={c.icon}
                color={c.color}
                bg={c.bg}
              />
            ))}
          </View>
        </View>

        {/* ══ REVISION ALERT ══ */}
        {counts.revision > 0 && (
          <View style={s.alertCard}>
            <View style={s.alertIconWrap}>
              <Ionicons name="alert-circle" size={26} color="#DC2626" />
            </View>
            <View style={s.alertBody}>
              <Text style={s.alertTitle}>Action Required</Text>
              <Text style={s.alertSub}>
                {counts.revision} job{counts.revision > 1 ? "s" : ""} sent back
                for revision
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#DC2626" />
          </View>
        )}

        {/* ══ ACTIVE JOBS ══ */}
        <View style={s.section}>
          <SectionHeader
            title="My Active Jobs"
            count={totalActive}
            onPress={
              totalActive > 0 ? () => navigation.navigate("Jobs") : undefined
            }
          />
          {activeJobs.length === 0 ? (
            <EmptyState
              title="No active jobs"
              message="You're all caught up! Pull down to refresh."
              icon="construct-outline"
            />
          ) : (
            activeJobs.map((job) => (
              <JobCard
                key={job._id}
                job={job}
                navigation={navigation}
                onStatusChange={setJobs}
              />
            ))
          )}
        </View>

        {/* ══ COMPLETED ROW ══ */}
        {counts.completed > 0 && (
          <TouchableOpacity
            style={s.completedCard}
            onPress={() => navigation.navigate("Jobs")}
            activeOpacity={0.8}
          >
            <View style={s.completedIconWrap}>
              <Ionicons name="checkmark-circle" size={24} color="#059669" />
            </View>
            <View style={s.completedBody}>
              <Text style={s.completedTitle}>Completed Jobs</Text>
              <Text style={s.completedSub}>
                {counts.completed} job{counts.completed > 1 ? "s" : ""} finished
                today
              </Text>
            </View>
            <View style={s.completedArrow}>
              <Ionicons name="arrow-forward" size={16} color="#059669" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PRIMARY },
  scroll: { flex: 1, backgroundColor: BG },
  content: { paddingBottom: 100 },

  // ── Header
  header: {
    backgroundColor: PRIMARY,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: 28,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.lg,
  },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.3,
  },
  notifDot: {
    position: "absolute",
    top: 7,
    right: 7,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  notifDotText: { fontSize: 8, color: "#fff", fontWeight: "800" },

  profileBlock: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  profileLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 20, fontWeight: "800", color: "#fff" },
  greetText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "500",
    marginBottom: 2,
  },
  nameText: { fontSize: 20, fontWeight: "800", color: "#fff", lineHeight: 24 },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  roleDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#10B981" },
  roleChipText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "600",
  },

  progressBlock: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  progressNum: {
    fontSize: 26,
    fontWeight: "800",
    color: PRIMARY,
    lineHeight: 30,
  },
  progressLbl: {
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    fontWeight: "600",
    marginTop: 2,
  },

  progressBarWrap: { gap: 6 },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: PRIMARY,
  },
  progressBarLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "500",
  },

  // ── Stats
  statsSection: {
    paddingHorizontal: SPACING.md,
    marginTop: -14,
    marginBottom: SPACING.md,
  },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },

  // ── Alert
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: 18,
    padding: 16,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: "#FECACA",
    ...SHADOW.sm,
  },
  alertIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
  },
  alertBody: { flex: 1 },
  alertTitle: { fontSize: 14, fontWeight: "800", color: "#991B1B" },
  alertSub: { fontSize: 12, color: "#B91C1C", marginTop: 2, fontWeight: "500" },

  // ── Section
  section: { paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },

  // ── Completed card
  completedCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: SURFACE,
    borderRadius: 18,
    padding: 16,
    marginHorizontal: SPACING.md,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    ...SHADOW.sm,
  },
  completedIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  completedBody: { flex: 1 },
  completedTitle: { fontSize: 14, fontWeight: "700", color: DARK },
  completedSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  completedArrow: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
});
