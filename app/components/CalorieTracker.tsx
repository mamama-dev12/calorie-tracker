"use client";
import { useState, useEffect, useCallback, useMemo } from "react";

type Meal = "breakfast" | "lunch" | "dinner" | "snack";
type FoodEntry = {
  id: string;
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  amount: number;
  meal: Meal;
};
type DayRecord = { date: string; entries: FoodEntry[] };
type Settings = { targetCalories: number; targetProtein: number; targetFat: number; targetCarbs: number };

const RECORDS_KEY = "calorie-tracker-records";
const SETTINGS_KEY = "calorie-tracker-settings";

const MEAL_LABELS: Record<Meal, string> = {
  breakfast: "朝食",
  lunch: "昼食",
  dinner: "夕食",
  snack: "間食",
};
const MEAL_COLORS: Record<Meal, string> = {
  breakfast: "bg-orange-100 text-orange-700",
  lunch: "bg-yellow-100 text-yellow-700",
  dinner: "bg-blue-100 text-blue-700",
  snack: "bg-purple-100 text-purple-700",
};

// 食品DB (per 100g)
type FoodDB = { name: string; calories: number; protein: number; fat: number; carbs: number };
const FOOD_DB: FoodDB[] = [
  // 主食
  { name: "白米（炊いたもの）", calories: 168, protein: 2.5, fat: 0.3, carbs: 37.1 },
  { name: "食パン", calories: 264, protein: 9.3, fat: 4.4, carbs: 46.7 },
  { name: "うどん（ゆで）", calories: 95, protein: 2.6, fat: 0.4, carbs: 20.8 },
  { name: "そば（ゆで）", calories: 132, protein: 4.8, fat: 1.0, carbs: 26.0 },
  { name: "パスタ（ゆで）", calories: 149, protein: 5.8, fat: 0.9, carbs: 28.4 },
  { name: "フランスパン", calories: 279, protein: 9.4, fat: 1.3, carbs: 57.5 },
  { name: "オートミール", calories: 380, protein: 13.7, fat: 5.7, carbs: 69.1 },
  // 肉類
  { name: "鶏胸肉（皮なし）", calories: 108, protein: 23.3, fat: 1.2, carbs: 0 },
  { name: "鶏もも肉（皮あり）", calories: 204, protein: 17.3, fat: 14.2, carbs: 0 },
  { name: "豚ロース", calories: 263, protein: 19.3, fat: 19.2, carbs: 0.2 },
  { name: "豚バラ", calories: 395, protein: 14.4, fat: 35.4, carbs: 0.1 },
  { name: "牛バラ", calories: 472, protein: 11.0, fat: 47.5, carbs: 0.1 },
  { name: "牛もも", calories: 259, protein: 19.5, fat: 18.7, carbs: 0.5 },
  { name: "ひき肉（合い挽き）", calories: 224, protein: 17.0, fat: 16.0, carbs: 0.3 },
  // 魚介
  { name: "サーモン", calories: 204, protein: 20.1, fat: 12.8, carbs: 0.1 },
  { name: "マグロ（赤身）", calories: 125, protein: 26.4, fat: 1.4, carbs: 0.1 },
  { name: "サバ", calories: 247, protein: 20.6, fat: 16.8, carbs: 0.3 },
  { name: "エビ", calories: 83, protein: 18.4, fat: 0.3, carbs: 0.7 },
  // 卵・乳製品
  { name: "卵", calories: 151, protein: 12.3, fat: 10.3, carbs: 0.3 },
  { name: "牛乳", calories: 61, protein: 3.3, fat: 3.8, carbs: 4.8 },
  { name: "ヨーグルト（無糖）", calories: 62, protein: 3.6, fat: 3.0, carbs: 4.9 },
  { name: "チーズ（プロセス）", calories: 339, protein: 22.7, fat: 26.0, carbs: 1.3 },
  { name: "プロテイン（水溶き）", calories: 120, protein: 24.0, fat: 1.5, carbs: 3.0 },
  // 大豆
  { name: "豆腐（絹）", calories: 56, protein: 5.3, fat: 3.0, carbs: 2.0 },
  { name: "納豆", calories: 200, protein: 16.5, fat: 10.0, carbs: 12.1 },
  // 野菜
  { name: "ブロッコリー", calories: 33, protein: 4.3, fat: 0.5, carbs: 5.2 },
  { name: "キャベツ", calories: 23, protein: 1.3, fat: 0.2, carbs: 5.2 },
  { name: "ほうれん草", calories: 20, protein: 2.2, fat: 0.4, carbs: 3.1 },
  { name: "トマト", calories: 19, protein: 0.7, fat: 0.1, carbs: 4.0 },
  { name: "にんじん", calories: 39, protein: 0.7, fat: 0.1, carbs: 9.3 },
  { name: "玉ねぎ", calories: 37, protein: 1.0, fat: 0.1, carbs: 8.8 },
  { name: "もやし", calories: 14, protein: 1.7, fat: 0.1, carbs: 2.6 },
  // 果物
  { name: "バナナ", calories: 86, protein: 1.1, fat: 0.2, carbs: 22.5 },
  { name: "りんご", calories: 61, protein: 0.2, fat: 0.2, carbs: 16.2 },
  { name: "みかん", calories: 46, protein: 0.7, fat: 0.1, carbs: 12.0 },
  // その他
  { name: "アーモンド", calories: 608, protein: 19.6, fat: 51.8, carbs: 20.7 },
  { name: "マヨネーズ", calories: 703, protein: 1.5, fat: 76.0, carbs: 4.5 },
  { name: "ケチャップ", calories: 119, protein: 1.8, fat: 0.2, carbs: 29.0 },
  { name: "コーラ（350ml）", calories: 153, protein: 0, fat: 0, carbs: 39.0 },
  { name: "ビール（350ml）", calories: 140, protein: 1.1, fat: 0, carbs: 10.9 },
];

const toHalf = (v: string) =>
  v.replace(/[０-９．]/g, (c) =>
    c === "．" ? "." : String.fromCharCode(c.charCodeAt(0) - 0xff10 + 0x30)
  );

function calcFromAmount(food: FoodDB, amount: number) {
  const r = amount / 100;
  return {
    calories: Math.round(food.calories * r),
    protein: Math.round(food.protein * r * 10) / 10,
    fat: Math.round(food.fat * r * 10) / 10,
    carbs: Math.round(food.carbs * r * 10) / 10,
  };
}

type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
type GoalType = "lose" | "maintain" | "gain";

const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "ほぼ運動しない（デスクワーク中心）",
  light: "軽い運動（週1〜3回）",
  moderate: "適度な運動（週3〜5回）",
  active: "激しい運動（週6〜7回）",
  very_active: "非常に激しい運動（肉体労働など）",
};
const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
};
const GOAL_LABELS: Record<GoalType, string> = {
  lose: "減量（体重を減らしたい）",
  maintain: "維持（体重を維持したい）",
  gain: "増量（筋肉・体重を増やしたい）",
};
const GOAL_ADJUSTMENT: Record<GoalType, number> = { lose: -400, maintain: 0, gain: 300 };

function calcTargets(
  gender: "male" | "female",
  age: number,
  height: number,
  weight: number,
  activity: ActivityLevel,
  goal: GoalType
) {
  // Mifflin-St Jeor
  const bmr = gender === "male"
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161;
  const tdee = Math.round(bmr * ACTIVITY_MULTIPLIER[activity]);
  const targetCal = Math.max(1200, tdee + GOAL_ADJUSTMENT[goal]);
  // PFC比率: 減量時はタンパク質多め、増量時は炭水化物多め
  const proteinRatio = goal === "lose" ? 0.30 : goal === "gain" ? 0.25 : 0.25;
  const fatRatio = 0.25;
  const carbRatio = 1 - proteinRatio - fatRatio;
  return {
    calories: Math.round(targetCal),
    protein: Math.round((targetCal * proteinRatio) / 4),
    fat: Math.round((targetCal * fatRatio) / 9),
    carbs: Math.round((targetCal * carbRatio) / 4),
    bmr: Math.round(bmr),
    tdee,
  };
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className={`h-2 rounded-full transition-all ${over ? "bg-red-400" : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CalorieTracker() {
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [settings, setSettings] = useState<Settings>({ targetCalories: 2000, targetProtein: 120, targetFat: 60, targetCarbs: 250 });
  const [dateInput, setDateInput] = useState(() => new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<"today" | "history">("today");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [addMeal, setAddMeal] = useState<Meal>("breakfast");
  const [toast, setToast] = useState("");

  // 食品追加モーダル用
  const [mode, setMode] = useState<"db" | "manual">("db");
  const [search, setSearch] = useState("");
  const [selectedFood, setSelectedFood] = useState<FoodDB | null>(null);
  const [amountInput, setAmountInput] = useState("100");
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState("");
  const [manualProtein, setManualProtein] = useState("");
  const [manualFat, setManualFat] = useState("");
  const [manualCarbs, setManualCarbs] = useState("");

  // 設定モーダル用
  const [sTargetCal, setSTargetCal] = useState("");
  const [sTargetP, setSTargetP] = useState("");
  const [sTargetF, setSTargetF] = useState("");
  const [sTargetC, setSTargetC] = useState("");
  const [calcOpen, setCalcOpen] = useState(false);
  const [calcGender, setCalcGender] = useState<"male" | "female">("male");
  const [calcAge, setCalcAge] = useState("");
  const [calcHeight, setCalcHeight] = useState("");
  const [calcWeight, setCalcWeight] = useState("");
  const [calcActivity, setCalcActivity] = useState<ActivityLevel>("moderate");
  const [calcGoal, setCalcGoal] = useState<GoalType>("lose");
  const [calcResult, setCalcResult] = useState<ReturnType<typeof calcTargets> | null>(null);

  useEffect(() => {
    const r = localStorage.getItem(RECORDS_KEY);
    const s = localStorage.getItem(SETTINGS_KEY);
    if (r) setRecords(JSON.parse(r));
    if (s) {
      const parsed: Settings = JSON.parse(s);
      setSettings(parsed);
      setSTargetCal(String(parsed.targetCalories));
      setSTargetP(String(parsed.targetProtein));
      setSTargetF(String(parsed.targetFat));
      setSTargetC(String(parsed.targetCarbs));
    }
  }, []);

  const saveRecords = useCallback((next: DayRecord[]) => {
    setRecords(next);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(next));
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const todayRecord = useMemo(
    () => records.find((r) => r.date === dateInput) ?? { date: dateInput, entries: [] },
    [records, dateInput]
  );

  const totals = useMemo(() => {
    const e = todayRecord.entries;
    return {
      calories: e.reduce((s, x) => s + x.calories, 0),
      protein: Math.round(e.reduce((s, x) => s + x.protein, 0) * 10) / 10,
      fat: Math.round(e.reduce((s, x) => s + x.fat, 0) * 10) / 10,
      carbs: Math.round(e.reduce((s, x) => s + x.carbs, 0) * 10) / 10,
    };
  }, [todayRecord]);

  const openAdd = (meal: Meal) => {
    setAddMeal(meal);
    setMode("db");
    setSearch("");
    setSelectedFood(null);
    setAmountInput("100");
    setManualName(""); setManualCalories(""); setManualProtein(""); setManualFat(""); setManualCarbs("");
    setAddOpen(true);
  };

  const commitAdd = () => {
    let entry: Omit<FoodEntry, "id" | "meal">;
    if (mode === "db") {
      if (!selectedFood) return;
      const amount = parseFloat(toHalf(amountInput)) || 100;
      const n = calcFromAmount(selectedFood, amount);
      entry = { name: selectedFood.name, amount, ...n };
    } else {
      const name = manualName.trim();
      const cal = parseFloat(toHalf(manualCalories));
      if (!name || isNaN(cal)) return;
      entry = {
        name,
        amount: 0,
        calories: Math.round(cal),
        protein: parseFloat(toHalf(manualProtein)) || 0,
        fat: parseFloat(toHalf(manualFat)) || 0,
        carbs: parseFloat(toHalf(manualCarbs)) || 0,
      };
    }
    const newEntry: FoodEntry = { ...entry, id: crypto.randomUUID(), meal: addMeal };
    const existing = records.find((r) => r.date === dateInput);
    const next = existing
      ? records.map((r) => r.date === dateInput ? { ...r, entries: [...r.entries, newEntry] } : r)
      : [...records, { date: dateInput, entries: [newEntry] }];
    saveRecords(next);
    setAddOpen(false);
    showToast("追加しました");
  };

  const exportCSV = () => {
    const header = "日付,食事,食品名,量(g),カロリー(kcal),タンパク質(g),脂質(g),炭水化物(g)";
    const rows = records.flatMap((r) =>
      r.entries.map((e) =>
        `${r.date},${MEAL_LABELS[e.meal]},${e.name},${e.amount},${e.calories},${e.protein},${e.fat},${e.carbs}`
      )
    );
    const csv = "﻿" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `カロリー記録_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = (file: File) => {
    const mealMap: Record<string, Meal> = { 朝食: "breakfast", 昼食: "lunch", 夕食: "dinner", 間食: "snack" };
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string).replace(/^﻿/, "");
      const lines = text.split("\n").filter((l) => l.trim()).slice(1);
      const dayMap = new Map<string, FoodEntry[]>();
      for (const line of lines) {
        const parts = line.split(",");
        if (parts.length < 8) continue;
        const [date, mealLabel, name, amount, calories, protein, fat, carbs] = parts;
        const meal = mealMap[mealLabel.trim()] ?? "snack";
        if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) continue;
        const entry: FoodEntry = {
          id: crypto.randomUUID(),
          meal,
          name: name.trim(),
          amount: parseFloat(amount) || 0,
          calories: parseFloat(calories) || 0,
          protein: parseFloat(protein) || 0,
          fat: parseFloat(fat) || 0,
          carbs: parseFloat(carbs) || 0,
        };
        const list = dayMap.get(date.trim()) ?? [];
        list.push(entry);
        dayMap.set(date.trim(), list);
      }
      if (dayMap.size === 0) { showToast("読み込めるデータがありませんでした"); return; }
      const merged = [...records];
      dayMap.forEach((entries, date) => {
        const idx = merged.findIndex((r) => r.date === date);
        if (idx >= 0) merged[idx] = { date, entries: [...merged[idx].entries, ...entries] };
        else merged.push({ date, entries });
      });
      merged.sort((a, b) => a.date.localeCompare(b.date));
      saveRecords(merged);
      showToast(`${dayMap.size}日分をインポートしました`);
    };
    reader.readAsText(file, "utf-8");
  };

  const deleteEntry = (entryId: string) => {
    const next = records.map((r) =>
      r.date === dateInput ? { ...r, entries: r.entries.filter((e) => e.id !== entryId) } : r
    );
    saveRecords(next);
  };

  const filteredDB = useMemo(
    () => FOOD_DB.filter((f) => f.name.includes(search)),
    [search]
  );

  const meals: Meal[] = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-5 py-2 rounded-full text-sm shadow-lg z-50">
          {toast}
        </div>
      )}

      <header className="bg-amber-500 text-white shadow">
        <div className="max-w-xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">カロリー管理</h1>
            <p className="text-xs text-white/70">
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="bg-transparent text-white/90 text-xs"
              />
            </p>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-white/80 hover:text-white text-sm border border-white/40 rounded-lg px-3 py-1"
          >
            設定
          </button>
        </div>
      </header>

      <div className="max-w-xl mx-auto">
        {/* タブ */}
        <div className="mx-4 mt-4 flex gap-1 bg-gray-200 rounded-xl p-1">
          {(["today", "history"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white shadow text-amber-600" : "text-gray-500"}`}
            >
              {t === "today" ? "今日の記録" : "履歴"}
            </button>
          ))}
        </div>

        {tab === "today" && (
          <>
            {/* サマリー */}
            <div className="bg-white mx-4 mt-3 rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-400">摂取カロリー</p>
                  <p className="text-3xl font-bold text-amber-500">{totals.calories.toLocaleString()}<span className="text-base font-normal text-gray-400 ml-1">kcal</span></p>
                </div>
                <p className="text-sm text-gray-400">目標 {settings.targetCalories.toLocaleString()} kcal</p>
              </div>
              <ProgressBar value={totals.calories} max={settings.targetCalories} color="bg-amber-400" />

              <div className="grid grid-cols-3 gap-3 pt-1">
                {([
                  { key: "protein", label: "タンパク質", value: totals.protein, target: settings.targetProtein, color: "bg-blue-400" },
                  { key: "fat", label: "脂質", value: totals.fat, target: settings.targetFat, color: "bg-red-400" },
                  { key: "carbs", label: "炭水化物", value: totals.carbs, target: settings.targetCarbs, color: "bg-green-400" },
                ] as const).map((item) => (
                  <div key={item.key} className="space-y-1">
                    <div className="flex justify-between items-baseline">
                      <p className="text-xs text-gray-500">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.target}g</p>
                    </div>
                    <p className="text-base font-bold text-gray-800">{item.value}g</p>
                    <ProgressBar value={item.value} max={item.target} color={item.color} />
                  </div>
                ))}
              </div>
            </div>

            {/* 食事ごとの記録 */}
            {meals.map((meal) => {
              const mealEntries = todayRecord.entries.filter((e) => e.meal === meal);
              const mealCal = mealEntries.reduce((s, e) => s + e.calories, 0);
              return (
                <div key={meal} className="bg-white mx-4 mt-3 rounded-2xl shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${MEAL_COLORS[meal]}`}>
                        {MEAL_LABELS[meal]}
                      </span>
                      {mealCal > 0 && <span className="text-xs text-gray-400">{mealCal} kcal</span>}
                    </div>
                    <button
                      onClick={() => openAdd(meal)}
                      className="text-amber-500 text-xl font-bold leading-none"
                    >
                      +
                    </button>
                  </div>
                  {mealEntries.length === 0 ? (
                    <p className="text-xs text-gray-300 px-4 py-3">まだ記録がありません</p>
                  ) : (
                    <ul className="divide-y divide-gray-50">
                      {mealEntries.map((e) => (
                        <li key={e.id} className="flex items-center px-4 py-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-800 truncate">{e.name}</p>
                            <p className="text-xs text-gray-400">P:{e.protein}g F:{e.fat}g C:{e.carbs}g</p>
                          </div>
                          <p className="text-sm font-bold text-amber-600 flex-shrink-0">{e.calories}kcal</p>
                          <button onClick={() => deleteEntry(e.id)} className="text-gray-200 hover:text-red-400 text-lg leading-none">×</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </>
        )}

        {tab === "history" && (
          <div className="bg-white mx-4 mt-3 rounded-2xl shadow-sm overflow-hidden">
            {records.length === 0 ? (
              <p className="text-center text-gray-400 py-12 text-sm">まだ記録がありません</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {[...records].sort((a, b) => b.date.localeCompare(a.date)).map((r) => {
                  const cal = r.entries.reduce((s, e) => s + e.calories, 0);
                  const pro = Math.round(r.entries.reduce((s, e) => s + e.protein, 0) * 10) / 10;
                  return (
                    <li
                      key={r.date}
                      className="px-4 py-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => { setDateInput(r.date); setTab("today"); }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">{r.date}</p>
                        <p className="text-base font-bold text-amber-600">{cal.toLocaleString()} kcal</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">P:{pro}g · {r.entries.length}品目</p>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* 関連ツール */}
        <a
          href="https://weight-tracker-ecru.vercel.app"
          target="_blank"
          rel="noopener noreferrer"
          className="mx-4 mt-3 flex items-center justify-between bg-white rounded-2xl shadow-sm px-4 py-3 hover:bg-gray-50 active:bg-gray-100"
        >
          <div>
            <p className="text-xs text-gray-400">関連ツール</p>
            <p className="text-sm font-bold text-green-600">体重管理アプリ →</p>
            <p className="text-xs text-gray-400">体重を記録・グラフで可視化</p>
          </div>
          <span className="text-2xl">⚖️</span>
        </a>

        <div className="h-8" />
      </div>

      {/* 食品追加モーダル */}
      {addOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-40" onClick={() => setAddOpen(false)}>
          <div className="bg-white w-full max-w-xl mx-auto rounded-t-3xl max-h-[85vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-800">
                {MEAL_LABELS[addMeal]}に追加
              </h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 text-xl">×</button>
            </div>

            {/* DB / 手入力 切り替え */}
            <div className="flex gap-1 mx-4 mt-3 bg-gray-100 rounded-xl p-1">
              {(["db", "manual"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === m ? "bg-white shadow text-amber-600" : "text-gray-500"}`}
                >
                  {m === "db" ? "食品DBから選ぶ" : "手入力"}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {mode === "db" ? (
                <>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setSelectedFood(null); }}
                    placeholder="食品名で検索（例: 鶏、ご飯）"
                    className="border rounded-xl px-3 py-2 text-sm w-full mt-3"
                  />
                  {!selectedFood ? (
                    <ul className="mt-2 divide-y divide-gray-100 border rounded-xl overflow-hidden">
                      {filteredDB.slice(0, 20).map((f) => (
                        <li
                          key={f.name}
                          onClick={() => setSelectedFood(f)}
                          className="px-3 py-2.5 cursor-pointer hover:bg-amber-50 active:bg-amber-100"
                        >
                          <p className="text-sm text-gray-800">{f.name}</p>
                          <p className="text-xs text-gray-400">{f.calories}kcal / P:{f.protein}g F:{f.fat}g C:{f.carbs}g（100gあたり）</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <div className="bg-amber-50 rounded-xl p-3">
                        <p className="text-sm font-bold text-gray-800">{selectedFood.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">100gあたり {selectedFood.calories}kcal</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <label className="text-sm text-gray-500 flex-shrink-0">量</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={amountInput}
                          onChange={(e) => setAmountInput(e.target.value)}
                          className="border rounded-xl px-3 py-2 text-sm w-24 text-right"
                        />
                        <span className="text-sm text-gray-500">g</span>
                        <button onClick={() => setSelectedFood(null)} className="ml-auto text-xs text-gray-400 underline">選び直す</button>
                      </div>
                      {(() => {
                        const amount = parseFloat(toHalf(amountInput)) || 100;
                        const n = calcFromAmount(selectedFood, amount);
                        return (
                          <div className="bg-gray-50 rounded-xl p-3 grid grid-cols-4 gap-2 text-center">
                            <div><p className="text-xs text-gray-400">カロリー</p><p className="text-sm font-bold text-amber-600">{n.calories}</p></div>
                            <div><p className="text-xs text-gray-400">P</p><p className="text-sm font-bold text-blue-600">{n.protein}g</p></div>
                            <div><p className="text-xs text-gray-400">F</p><p className="text-sm font-bold text-red-500">{n.fat}g</p></div>
                            <div><p className="text-xs text-gray-400">C</p><p className="text-sm font-bold text-green-600">{n.carbs}g</p></div>
                          </div>
                        );
                      })()}
                      <button
                        onClick={commitAdd}
                        className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold text-base"
                      >
                        追加する
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">食品名 *</label>
                    <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)} placeholder="例: プロテインバー" className="border rounded-xl px-3 py-2 text-sm w-full" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">カロリー（kcal）*</label>
                    <input type="text" inputMode="decimal" value={manualCalories} onChange={(e) => setManualCalories(e.target.value)} placeholder="例: 200" className="border rounded-xl px-3 py-2 text-sm w-full" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { label: "タンパク質 (g)", val: manualProtein, set: setManualProtein },
                      { label: "脂質 (g)", val: manualFat, set: setManualFat },
                      { label: "炭水化物 (g)", val: manualCarbs, set: setManualCarbs },
                    ]).map(({ label, val, set }) => (
                      <div key={label}>
                        <label className="text-xs text-gray-500 block mb-1">{label}</label>
                        <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} placeholder="0" className="border rounded-xl px-3 py-2 text-sm w-full" />
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={commitAdd}
                    disabled={!manualName.trim() || !manualCalories}
                    className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold text-base disabled:opacity-40"
                  >
                    追加する
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 設定モーダル */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-40" onClick={() => setSettingsOpen(false)}>
          <div className="bg-white w-full max-w-xl mx-auto rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800">目標設定</h2>

            {/* 目標カロリー自動計算 */}
            <button
              onClick={() => { setCalcOpen(!calcOpen); setCalcResult(null); }}
              className="w-full border border-amber-400 text-amber-600 rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2"
            >
              <span>✨</span>
              {calcOpen ? "自動計算を閉じる" : "目標カロリーを自動計算する"}
            </button>

            {calcOpen && (
              <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
                {/* 性別 */}
                <div className="flex gap-2">
                  {(["male", "female"] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => setCalcGender(g)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${calcGender === g ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200"}`}
                    >
                      {g === "male" ? "男性" : "女性"}
                    </button>
                  ))}
                </div>
                {/* 年齢・身長・体重 */}
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { label: "年齢", val: calcAge, set: setCalcAge, unit: "歳" },
                    { label: "身長", val: calcHeight, set: setCalcHeight, unit: "cm" },
                    { label: "体重", val: calcWeight, set: setCalcWeight, unit: "kg" },
                  ]).map(({ label, val, set, unit }) => (
                    <div key={label}>
                      <label className="text-xs text-gray-500 block mb-1">{label}</label>
                      <div className="flex items-center gap-1">
                        <input
                          type="text" inputMode="decimal" value={val}
                          onChange={(e) => set(e.target.value)}
                          className="border rounded-lg px-2 py-1.5 text-sm w-full bg-white"
                        />
                        <span className="text-xs text-gray-400 flex-shrink-0">{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* 活動量 */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">活動量</label>
                  <select
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(e.target.value as ActivityLevel)}
                    className="border rounded-xl px-3 py-2 text-sm w-full bg-white"
                  >
                    {(Object.keys(ACTIVITY_LABELS) as ActivityLevel[]).map((k) => (
                      <option key={k} value={k}>{ACTIVITY_LABELS[k]}</option>
                    ))}
                  </select>
                </div>
                {/* 目標 */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">目標</label>
                  <div className="grid grid-cols-3 gap-1">
                    {(Object.keys(GOAL_LABELS) as GoalType[]).map((g) => (
                      <button
                        key={g}
                        onClick={() => setCalcGoal(g)}
                        className={`py-2 rounded-xl text-xs font-medium border transition-colors ${calcGoal === g ? "bg-amber-500 text-white border-amber-500" : "bg-white text-gray-600 border-gray-200"}`}
                      >
                        {g === "lose" ? "減量" : g === "maintain" ? "維持" : "増量"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    const age = parseInt(toHalf(calcAge));
                    const height = parseFloat(toHalf(calcHeight));
                    const weight = parseFloat(toHalf(calcWeight));
                    if (isNaN(age) || isNaN(height) || isNaN(weight)) { showToast("年齢・身長・体重を入力してください"); return; }
                    setCalcResult(calcTargets(calcGender, age, height, weight, calcActivity, calcGoal));
                  }}
                  className="w-full bg-amber-500 text-white rounded-xl py-2.5 font-bold text-sm"
                >
                  計算する
                </button>

                {calcResult && (
                  <div className="bg-white rounded-xl p-4 space-y-3 border border-amber-200">
                    <p className="text-xs text-gray-500">基礎代謝: <span className="font-bold text-gray-800">{calcResult.bmr} kcal</span>　消費カロリー: <span className="font-bold text-gray-800">{calcResult.tdee} kcal</span></p>
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div><p className="text-xs text-gray-400">カロリー</p><p className="text-base font-bold text-amber-600">{calcResult.calories}</p></div>
                      <div><p className="text-xs text-gray-400">P(g)</p><p className="text-base font-bold text-blue-600">{calcResult.protein}</p></div>
                      <div><p className="text-xs text-gray-400">F(g)</p><p className="text-base font-bold text-red-500">{calcResult.fat}</p></div>
                      <div><p className="text-xs text-gray-400">C(g)</p><p className="text-base font-bold text-green-600">{calcResult.carbs}</p></div>
                    </div>
                    <button
                      onClick={() => {
                        setSTargetCal(String(calcResult.calories));
                        setSTargetP(String(calcResult.protein));
                        setSTargetF(String(calcResult.fat));
                        setSTargetC(String(calcResult.carbs));
                        setCalcOpen(false);
                        showToast("目標値に反映しました");
                      }}
                      className="w-full border border-amber-500 text-amber-600 rounded-xl py-2 text-sm font-bold"
                    >
                      この値を目標に設定する
                    </button>
                  </div>
                )}
              </div>
            )}

            {([
              { label: "目標カロリー (kcal)", val: sTargetCal, set: setSTargetCal },
              { label: "目標タンパク質 (g)", val: sTargetP, set: setSTargetP },
              { label: "目標脂質 (g)", val: sTargetF, set: setSTargetF },
              { label: "目標炭水化物 (g)", val: sTargetC, set: setSTargetC },
            ]).map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-sm text-gray-500 block mb-1">{label}</label>
                <input type="text" inputMode="decimal" value={val} onChange={(e) => set(e.target.value)} className="border rounded-xl px-4 py-2 w-full text-base" />
              </div>
            ))}
            <button
              onClick={() => {
                const s: Settings = {
                  targetCalories: parseInt(toHalf(sTargetCal)) || 2000,
                  targetProtein: parseInt(toHalf(sTargetP)) || 120,
                  targetFat: parseInt(toHalf(sTargetF)) || 60,
                  targetCarbs: parseInt(toHalf(sTargetC)) || 250,
                };
                setSettings(s);
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
                setSettingsOpen(false);
                showToast("保存しました");
              }}
              className="w-full bg-amber-500 text-white rounded-xl py-3 font-bold text-base"
            >
              保存
            </button>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">データのバックアップ</p>
              <p className="text-xs text-gray-400">ブラウザのデータ消去や機種変更に備えてCSVで保存できます。</p>
              <button
                onClick={() => { exportCSV(); setSettingsOpen(false); }}
                disabled={records.length === 0}
                className="w-full border border-amber-500 text-amber-600 rounded-xl py-3 font-bold text-sm disabled:opacity-40"
              >
                CSVでエクスポート（{records.reduce((s, r) => s + r.entries.length, 0)}件）
              </button>
              <label className="w-full border border-gray-300 text-gray-600 rounded-xl py-3 font-bold text-sm flex items-center justify-center cursor-pointer">
                CSVからインポート
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) { importCSV(file); setSettingsOpen(false); }
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
