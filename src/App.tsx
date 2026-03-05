/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Pill, 
  PlusCircle, 
  ShieldCheck, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  Undo2, 
  AlertCircle,
  Trash2
} from 'lucide-react';
import { getTodayMeds, addMed, getCaregiver, saveCaregiver } from "./lib/storage";

// --- Types ---

interface Medication {
  id: number;
  name: string;
  time: string;
  times_per_day: string;
  with_meal: string;
  start_date: string;
}

interface DoseLog {
  id: number;
  medication_id: number;
  scheduled_at: string;
  taken_at: string | null;
  status: 'pending' | 'taken';
  name: string;
  scheduled_time: string;
}

interface Caregiver {
  id: number;
  name: string;
  phone: string;
  delay_minutes: number;
  enabled: boolean;
}

// --- Components ---

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  disabled = false,
  className = "" 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  disabled?: boolean;
  className?: string;
}) => {
  const baseStyles = "h-[64px] rounded-2xl font-bold text-[20px] transition-all active:scale-95 flex items-center justify-center gap-2 px-6 w-full";
  const variants = {
    primary: "bg-[#2E7D32] text-white shadow-lg shadow-[#2E7D32]/20 disabled:bg-gray-300 disabled:shadow-none",
    secondary: "bg-[#E2F3E6] text-[#2E7D32]",
    danger: "bg-[#D32F2F] text-white",
    outline: "border-2 border-gray-300 text-[#111827] bg-white"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const InputField = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  type = "text",
  helperText 
}: { 
  label: string; 
  value: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  placeholder?: string;
  type?: string;
  helperText?: string;
}) => (
  <div className="space-y-2">
    <label className="block text-[18px] font-bold text-[#111827]">{label}</label>
    <input 
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full h-[56px] px-5 rounded-xl border-2 border-gray-200 focus:border-[#2E7D32] focus:ring-0 text-[18px] transition-all outline-none"
    />
    {helperText && <p className="text-[14px] text-gray-500">{helperText}</p>}
  </div>
);

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState<'today' | 'register' | 'family'>('today');
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doseLogs, setDoseLogs] = useState<DoseLog[]>([]);
  const [caregiver, setCaregiver] = useState<Caregiver | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [undoLogId, setUndoLogId] = useState<number | null>(null);
  const [isActionDisabled, setIsActionDisabled] = useState(false);

  // Fetch Data
const fetchData = useCallback(async () => {
try {
const meds = getTodayMeds();
setMedications(meds);

const cg = getCaregiver();
setCaregiver(cg ?? null);

// MVP에서는 서버 로그 대신 빈 배열
setDoseLogs([]);
} catch (err) {
console.error("Failed to fetch data", err);
}
}, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showToast = (message: string, duration = 2000) => {
    setToast(message);
    setTimeout(() => setToast(null), duration);
  };

  const handleTakeMed = async (med: Medication) => {
    if (isActionDisabled) return;
    setIsActionDisabled(true);

    const today = new Date().toISOString().split('T')[0];
    const scheduled_at = `${today}T${med.time}:00`;

    try {
      const res = await fetch('/api/dose-logs/take', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medication_id: med.id, scheduled_at })
      });
      const data = await res.json();
      
      setUndoLogId(data.id);
      showToast("복용 완료로 기록했어요");
      fetchData();

      // Undo window
      setTimeout(() => setUndoLogId(null), 5000);
      setTimeout(() => setIsActionDisabled(false), 1000);
    } catch (err) {
      console.error(err);
      setIsActionDisabled(false);
    }
  };

  const handleUndo = async () => {
    if (!undoLogId) return;
    try {
      await fetch('/api/dose-logs/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: undoLogId })
      });
      setUndoLogId(null);
      showToast("복용 기록을 취소했어요");
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // --- Screens ---

  const TodayScreen = () => {
    return (
      <div className="space-y-6 pb-32">
        <header className="py-4">
          <h1 className="text-[28px] font-bold text-[#111827]">오늘 복약</h1>
          <p className="text-[18px] text-[#6B7280]">오늘 챙겨야 할 약들이에요</p>
        </header>

        <div className="space-y-4">
          {medications.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <Pill className="w-16 h-16 mx-auto text-gray-300" />
              <p className="text-[20px] text-gray-500 font-medium">등록된 약이 없습니다.<br/>아래 버튼을 눌러 약을 등록해주세요.</p>
            </div>
          ) : (
            medications.map((med) => {
              const log = doseLogs.find(l => l.medication_id === med.id);
              const isTaken = log?.status === 'taken';

              return (
                <motion.div 
                  key={med.id}
                  layout
                  className={`p-6 rounded-[28px] border-2 transition-all ${isTaken ? 'bg-[#E2F3E6] border-[#2E7D32]/20' : 'bg-white border-gray-100 shadow-sm'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-[22px] font-bold text-[#111827]">{med.name}</h3>
                      <div className="flex items-center gap-2 text-[#6B7280] mt-1">
                        <Clock className="w-5 h-5" />
                        <span className="text-[18px] font-medium">{med.time}</span>
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[16px] font-bold ${isTaken ? 'bg-white text-[#2E7D32]' : 'bg-gray-100 text-gray-500'}`}>
                      {isTaken ? '✅ 복용 완료' : '⏰ 복용 전'}
                    </div>
                  </div>

                  {isTaken ? (
                    <Button variant="outline" className="bg-white/50 border-gray-200 text-gray-400" disabled>
                      복용 완료
                    </Button>
                  ) : (
                    <Button onClick={() => handleTakeMed(med)} disabled={isActionDisabled}>
                      복용했어요
                    </Button>
                  )}
                </motion.div>
              );
            })
          )}
        </div>

        <div className="fixed bottom-[100px] left-0 right-0 px-6 max-w-md mx-auto">
          <Button onClick={() => setActiveTab('register')} variant="outline" className="shadow-lg border-[#2E7D32] text-[#2E7D32]">
            <PlusCircle className="w-6 h-6" />
            약 추가하기
          </Button>
        </div>
      </div>
    );
  };

  const RegisterScreen = () => {
    const [name, setName] = useState('');
    const [time, setTime] = useState('08:00');
    const [timesPerDay, setTimesPerDay] = useState('1회');
    const [withMeal, setWithMeal] = useState('식후');
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

    const handleSave = async () => {
      if (!name) {
        showToast("약 이름을 입력하면 저장할 수 있어요");
        return;
      }
      if (!time) {
        showToast("복용 시간을 선택하면 저장할 수 있어요");
        return;
      }

      try {
        await const meds = getTodayMeds();
setMedications(meds);
, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, time, times_per_day: timesPerDay, with_meal: withMeal, start_date: startDate })
        });
        showToast("약 등록이 완료되었어요");
        await fetchData();
        setActiveTab('today');
      } catch (err) {
        console.error(err);
      }
    };

    return (
      <div className="space-y-8 pb-32">
        <header className="flex items-center gap-4 py-4">
          <button onClick={() => setActiveTab('today')} className="p-2 -ml-2">
            <ChevronLeft className="w-8 h-8" />
          </button>
          <h1 className="text-[28px] font-bold text-[#111827]">약 등록</h1>
        </header>

        <div className="space-y-6">
          <InputField 
            label="약 이름" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="예: 혈압약" 
          />
          
          <InputField 
            label="복용 시간" 
            type="time"
            value={time} 
            onChange={(e) => setTime(e.target.value)} 
          />

          <div className="space-y-3">
            <label className="block text-[18px] font-bold text-[#111827]">하루 횟수</label>
            <div className="grid grid-cols-3 gap-3">
              {['1회', '2회', '3회 이상'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setTimesPerDay(opt)}
                  className={`h-[56px] rounded-xl border-2 font-bold text-[18px] transition-all ${timesPerDay === opt ? 'border-[#2E7D32] bg-[#E2F3E6] text-[#2E7D32]' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-[18px] font-bold text-[#111827]">복용 시점</label>
            <div className="flex gap-3">
              {['식전', '식후'].map(opt => (
                <button 
                  key={opt}
                  onClick={() => setWithMeal(opt)}
                  className={`flex-1 h-[56px] rounded-xl border-2 font-bold text-[18px] transition-all ${withMeal === opt ? 'border-[#2E7D32] bg-[#E2F3E6] text-[#2E7D32]' : 'border-gray-200 bg-white text-gray-500'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <InputField 
            label="시작일" 
            type="date"
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
          />
        </div>

        <div className="flex gap-4 pt-4">
          <Button onClick={() => setActiveTab('today')} variant="outline">뒤로</Button>
          <Button onClick={handleSave}>저장하기</Button>
        </div>
      </div>
    );
  };
const FamilyScreen = () => {
const [name, setName] = useState(caregiver?.name || "");
const [phone, setPhone] = useState(caregiver?.phone || "");
const [delay, setDelay] = useState(caregiver?.delay_minutes || 30);
const [enabled, setEnabled] = useState(caregiver?.enabled || false);

const formatPhone = (val: string) => {
const nums = val.replace(/\D/g, "");
if (nums.length <= 3) return nums;
if (nums.length <= 7) return `${nums.slice(0, 3)}-${nums.slice(3)}`;
return `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
};

const handleSave = () => {
try {
saveCaregiver({
name,
phone,
delay_minutes: delay,
enabled,
});

const cg = getCaregiver();
if (cg) setCaregiver(cg);

showToast("설정이 저장되었어요");
fetchData();
} catch (err) {
console.error(err);
}
};

// ...아래 JSX는 기존 코드 유지
};

 
    return (
      <div className="space-y-8 pb-32">
        <header className="py-4">
          <h1 className="text-[28px] font-bold text-[#111827]">가족 안심 연락처</h1>
          <p className="text-[18px] text-[#6B7280]">미복용 시 보호자에게 알려드려요</p>
        </header>

        <div className="space-y-6">
          <InputField 
            label="보호자 이름" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="예: 딸 김지은" 
          />
          
          <InputField 
            label="전화번호" 
            value={phone} 
            onChange={(e) => setPhone(formatPhone(e.target.value))} 
            placeholder="010-1234-5678" 
            helperText="숫자만 입력해도 자동으로 형식을 맞춰드려요"
          />

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-[22px] font-bold text-[#111827]">미복용 알림 설정</h3>
            
            <div className="space-y-3">
              <label className="block text-[18px] font-bold text-[#6B7280]">지연시간</label>
              <div className="grid grid-cols-3 gap-3">
                {[20, 30, 60].map(m => (
                  <button 
                    key={m}
                    onClick={() => setDelay(m)}
                    className={`h-[56px] rounded-xl border-2 font-bold text-[18px] transition-all ${delay === m ? 'border-[#2E7D32] bg-[#E2F3E6] text-[#2E7D32]' : 'border-gray-200 bg-white text-gray-500'}`}
                  >
                    {m}분
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="space-y-1">
                <p className="text-[18px] font-bold text-[#111827]">미복용 시 보호자에게 알림</p>
                <p className="text-[16px] text-[#6B7280]">복용 후 {delay}분이 지나면 문자로 알려드려요</p>
              </div>
              <button 
                onClick={() => setEnabled(!enabled)}
                className={`w-14 h-8 rounded-full transition-all relative ${enabled ? 'bg-[#2E7D32]' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        <Button onClick={handleSave}>설정 저장</Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] text-[#111827] flex flex-col max-w-md mx-auto relative overflow-hidden">
      <main className="flex-1 px-6 overflow-y-auto">
        {activeTab === 'today' && <TodayScreen />}
        {activeTab === 'register' && <RegisterScreen />}
        {activeTab === 'family' && <FamilyScreen />}
      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 h-[88px] flex items-center justify-around px-2 z-40 max-w-md mx-auto pb-safe">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'today' ? 'text-[#2E7D32]' : 'text-gray-400'}`}
        >
          <Pill className={`w-8 h-8 ${activeTab === 'today' ? 'fill-[#2E7D32]/10' : ''}`} />
          <span className="text-[16px] font-bold">오늘 복약</span>
        </button>
        <button 
          onClick={() => setActiveTab('register')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'register' ? 'text-[#2E7D32]' : 'text-gray-400'}`}
        >
          <PlusCircle className={`w-8 h-8 ${activeTab === 'register' ? 'fill-[#2E7D32]/10' : ''}`} />
          <span className="text-[16px] font-bold">약 등록</span>
        </button>
        <button 
          onClick={() => setActiveTab('family')}
          className={`flex flex-col items-center gap-1 flex-1 transition-all ${activeTab === 'family' ? 'text-[#2E7D32]' : 'text-gray-400'}`}
        >
          <ShieldCheck className={`w-8 h-8 ${activeTab === 'family' ? 'fill-[#2E7D32]/10' : ''}`} />
          <span className="text-[16px] font-bold">가족 안심</span>
        </button>
      </nav>

      {/* Toast & Undo */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[360px]"
          >
            <div className="bg-[#111827] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3">
              <CheckCircle2 className="text-[#4ADE80] w-6 h-6" />
              <span className="text-[18px] font-bold">{toast}</span>
            </div>
          </motion.div>
        )}

        {undoLogId && activeTab === 'today' && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-[110px] left-1/2 -translate-x-1/2 z-50 w-[calc(100%-48px)] max-w-[360px]"
          >
            <div className="bg-[#111827] text-white pl-6 pr-3 py-3 rounded-2xl shadow-2xl flex items-center justify-between border border-gray-700">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-[#4ADE80] w-6 h-6" />
                <span className="text-[18px] font-bold">복용 완료로 기록했어요</span>
              </div>
              <button 
                onClick={handleUndo}
                className="bg-gray-700 px-4 py-2 rounded-xl text-[16px] font-bold flex items-center gap-1 active:bg-gray-600"
              >
                <Undo2 className="w-4 h-4" />
                되돌리기
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
