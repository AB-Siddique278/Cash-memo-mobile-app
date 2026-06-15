import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Download, 
  RotateCw, 
  Trash2, 
  User, 
  MapPin, 
  Phone, 
  Globe, 
  Plus, 
  AlertCircle, 
  Sparkles, 
  Check, 
  Bookmark, 
  History, 
  Settings, 
  ShoppingBag, 
  Eye, 
  Edit, 
  BarChart3, 
  RefreshCcw,
  Share2,
  Calendar,
  Layers,
  Sparkle
} from 'lucide-react';
import { toCanvas } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { CashMemoItem, BusinessProfile, CashMemoData, ProductPreset } from './types';

// Bengali Numeral converter helper
const BENGALI_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
export function toBengaliNum(num: string | number): string {
  const str = String(num);
  let res = '';
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char >= '0' && char <= '9') {
      res += BENGALI_DIGITS[parseInt(char, 10)];
    } else {
      res += char;
    }
  }
  return res;
}

// English to Bengali conversion for indices in table
const BENGALI_INDICES = ['০১', '০২', '০৩', '০৪', '০৫', '০৬', '০৭', '০৮', '০৯', '১০', '১১', '১২', '১৩', '১৪', '১৫'];

// Simple lightweight Bengali number-to-words converter
export function toBengaliWords(num: number): string {
  if (num === 0) return 'শূণ্য';
  
  const ones = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
  const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
  const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
  
  let words = '';
  
  // Handing lakh (লক্ষ), thousand (হাজার), hundred (শত)
  if (num >= 100000) {
    const lakh = Math.floor(num / 100000);
    words += toBengaliWords(lakh) + ' লক্ষ ';
    num %= 100000;
  }
  
  if (num >= 1000) {
    const thousand = Math.floor(num / 1000);
    words += (thousand === 1 ? 'এক' : toBengaliWords(thousand)) + ' হাজার ';
    num %= 1000;
  }
  
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    words += (hundred === 1 ? 'এক' : ones[hundred]) + ' শত ';
    num %= 100;
  }
  
  if (num > 0) {
    if (num < 10) {
      words += ones[num];
    } else if (num < 20) {
      words += teens[num - 10];
    } else {
      const ten = Math.floor(num / 10);
      const remain = num % 10;
      words += tens[ten] + (remain > 0 ? ones[remain] : '');
    }
  }
  
  return words.trim() + ' টাকা মাত্র';
}

const DEFAULT_PRODUCTS: ProductPreset[] = [
  { id: 'p1', name: 'T shirt Print', defaultRate: '70' },
  { id: 'p2', name: 'Polo T-shirt', defaultRate: '220' },
  { id: 'p3', name: 'Mug Print', defaultRate: '120' },
  { id: 'p4', name: 'Sublimation Print', defaultRate: '150' },
  { id: 'p5', name: 'Screen Print Development', defaultRate: '1200' },
  { id: 'p6', name: 'Rubber Print', defaultRate: '95' },
  { id: 'p7', name: 'Printer Toner Cartridge', defaultRate: '850' },
  { id: 'p8', name: 'Copier Spare Parts', defaultRate: '2500' }
];

export default function App() {
  // --- Persistent shop configuration & state ---
  const [profile, setProfile] = useState<BusinessProfile>(() => {
    const saved = localStorage.getItem('cashmemo_profile');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {
      shopName: 'প্রিন্ট সলিউশন্স',
      proprietorName: 'প্রোঃ মেহেদী হাসান নাবিল',
      services: 'উন্নতমানের টি-শার্ট, পোলো টি-শার্ট প্রস্তুতকারক ও সরবরাহকারী। টি-শার্ট স্ক্রীন প্রিন্ট, রাবার প্রিন্ট, সাবলিমেশন প্রিন্ট ও মগ প্রিন্ট করা হয়।\nপ্রিন্টার ও ফটোকপি মেশিনের টোনার কার্টিজ, স্পেয়ার পার্টস বিক্রেতা।',
      address: '২য় লেন, সিদ্দিক বাজার, বঙ্গবাজার, ঢাকা। | মগ: ইমামগঞ্জ ব্যবসায়ী সমিতি অফিসের পাশের বিল্ডিং, চকবাজার, ঢাকা।',
      mobile1: '01711-458715',
      mobile2: '01716-002215',
      logoUrl: 'https://i.ibb.co.com/XrnrKqNn/logo.jpg',
      websiteUrl: 'www.printsolutionsbd.com',
      noticeLine1: 'আপনার অর্ডার নিশ্চিত করার জন্য অবশ্যই ৫০% অগ্রিম করতে হবে।',
      noticeLine2: 'আর বাকি টাকা মাল নেয়ার সময় ১০০% পরিশোধ করে মাল নিতে হবে।',
      colorTheme: {
        primary: '#1a5fa8',
        secondary: '#2196a8',
        glow: '#e8f4ff'
      }
    };
  });

  // State for preset product list
  const [presets, setPresets] = useState<ProductPreset[]>(() => {
    const saved = localStorage.getItem('cashmemo_presets');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return DEFAULT_PRODUCTS;
  });

  // Unique Serial Strategy Configuration
  const [serialStyle, setSerialStyle] = useState<'sequential' | 'random' | 'timed'>(() => {
    return (localStorage.getItem('cashmemo_serial_style') as any) || 'sequential';
  });
  const [currentSerialSequence, setCurrentSerialSequence] = useState<number>(() => {
    return parseInt(localStorage.getItem('cashmemo_serial_seq') || '912', 10);
  });

  // Auto-increment toggle
  const [autoIncrementOnDownload, setAutoIncrementOnDownload] = useState<boolean>(true);

  // Active tab in mobile view
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'history' | 'profile' | 'presets'>('editor');

  // --- Current Memo Transaction details ---
  const [memoNum, setMemoNum] = useState<string>('');
  const [memoDate, setMemoDate] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerAddress, setCustomerAddress] = useState<string>('');
  const [customerMobile, setCustomerMobile] = useState<string>('');
  const [items, setItems] = useState<CashMemoItem[]>([]);
  const [condition1, setCondition1] = useState<string>('');
  const [condition2, setCondition2] = useState<string>('');
  const [advance, setAdvance] = useState<string>('');
  const [grossTotal, setGrossTotal] = useState<number>(0);
  const [balanceDue, setBalanceDue] = useState<number>(0);

  // --- History state ---
  const [historyList, setHistoryList] = useState<CashMemoData[]>(() => {
    const saved = localStorage.getItem('cashmemo_history');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  // --- Search history ---
  const [historySearch, setHistorySearch] = useState('');

  // --- Status and UI indicators ---
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'jpg' | null>(null);
  const [saveToast, setSaveToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const previewCardRef = useRef<HTMLDivElement>(null);

  // Initialize fresh items sheet (exactly 10 rows matching the image)
  const resetItemsList = () => {
    const initialRows: CashMemoItem[] = Array.from({ length: 10 }, () => ({
      desc: '',
      qty: '',
      rate: '',
      amt: ''
    }));
    setItems(initialRows);
  };

  // Generate unique memo serial based on settings
  const rollUniqueSerial = (customSeq?: number) => {
    const seq = customSeq !== undefined ? customSeq : currentSerialSequence;
    if (serialStyle === 'sequential') {
      const serialStr = String(seq);
      setMemoNum(serialStr);
    } else if (serialStyle === 'random') {
      // 4-digit unique numerical code
      const randNum = Math.floor(1000 + Math.random() * 9000);
      setMemoNum(String(randNum));
    } else {
      // Short timestamp serial
      const dateObj = new Date();
      const yr = String(dateObj.getFullYear()).slice(-2);
      const mo = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dy = String(dateObj.getDate()).padStart(2, '0');
      const sec = String(dateObj.valueOf()).slice(-4);
      setMemoNum(`${yr}${mo}${dy}-${sec}`);
    }
  };

  // Save profile to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('cashmemo_profile', JSON.stringify(profile));
  }, [profile]);

  // Save presets to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('cashmemo_presets', JSON.stringify(presets));
  }, [presets]);

  // Load initial states
  useEffect(() => {
    resetItemsList();
    // Default date to today (YYYY-MM-DD for input date type)
    const today = new Date().toISOString().split('T')[0];
    setMemoDate(today);
    rollUniqueSerial();
  }, [serialStyle]);

  // Sync calculations in real-time
  useEffect(() => {
    let sum = 0;
    items.forEach(item => {
      const q = parseFloat(item.qty) || 0;
      const r = parseFloat(item.rate) || 0;
      sum += q * r;
    });
    setGrossTotal(sum);
    
    const adv = parseFloat(advance) || 0;
    setBalanceDue(Math.max(0, sum - adv));
  }, [items, advance]);

  // Update item field handler
  const handleItemChange = (index: number, field: keyof CashMemoItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate field amount
    if (field === 'qty' || field === 'rate') {
      const qtyVal = parseFloat(field === 'qty' ? value : updated[index].qty) || 0;
      const rateVal = parseFloat(field === 'rate' ? value : updated[index].rate) || 0;
      updated[index].amt = qtyVal && rateVal ? String(qtyVal * rateVal) : '';
    }
    setItems(updated);
  };

  // Helper to quickly apply product preset to first empty row or specific index
  const applyPreset = (preset: ProductPreset, targetRowIndex?: number) => {
    let editIndex = targetRowIndex !== undefined ? targetRowIndex : -1;
    
    if (editIndex === -1) {
      // Find first row where item desc is empty
      editIndex = items.findIndex(it => !it.desc.trim());
      if (editIndex === -1) editIndex = 0; // fallback to first row
    }

    const updated = [...items];
    updated[editIndex] = {
      ...updated[editIndex],
      desc: preset.name,
      rate: preset.defaultRate,
      qty: updated[editIndex].qty || '1',
      amt: String((parseFloat(updated[editIndex].qty || '1') || 1) * (parseFloat(preset.defaultRate) || 0))
    };
    setItems(updated);
    showToast(`প্রিসেট "${preset.name}" ১ম উপলব্ধ লাইনে যোগ করা হয়েছে।`, 'info');
  };

  // Quick helper to show status messages
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setSaveToast({ message, type });
    setTimeout(() => {
      setSaveToast(null);
    }, 4000);
  };

  // Create a clean reset of transaction data
  const handleNewTransaction = () => {
    resetItemsList();
    setCustomerName('');
    setCustomerAddress('');
    setCustomerMobile('');
    setCondition1('');
    setCondition2('');
    setAdvance('');
    
    // Roll the serial number if sequential
    let nextSeq = currentSerialSequence;
    if (serialStyle === 'sequential') {
      nextSeq = currentSerialSequence + 1;
      setCurrentSerialSequence(nextSeq);
      localStorage.setItem('cashmemo_serial_seq', String(nextSeq));
    }
    rollUniqueSerial(nextSeq);
    showToast('নতুন ক্যাশ মেমো তৈরির জন্য সমস্ত ফর্ম রিসেট করা হয়েছে!', 'success');
  };

  // Save current memo state to History Log
  const archiveCurrentMemo = (assignedNum: string): CashMemoData => {
    const memoRecord: CashMemoData = {
      id: Math.random().toString(36).substring(2, 11),
      memoNum: assignedNum,
      date: memoDate,
      customerName: customerName || 'সাধারণ গ্রাহক',
      customerAddress: customerAddress || 'অজানা',
      customerMobile: customerMobile || 'মোবাইল নেই',
      items: items.filter(it => it.desc.trim().length > 0), // Save non-empty items only
      condition1,
      condition2,
      advance,
      grossTotal,
      balanceDue,
      createdAt: new Date().toLocaleString()
    };

    const updatedHistory = [memoRecord, ...historyList];
    setHistoryList(updatedHistory);
    localStorage.setItem('cashmemo_history', JSON.stringify(updatedHistory));
    return memoRecord;
  };

  // Export current memo as PDF
  const handleDownloadPDF = async () => {
    if (!previewCardRef.current) return;
    setDownloadingFormat('pdf');
    showToast('মেমো পিডিএফ তৈরি হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...', 'info');

    try {
      // 1. Snapshot the memo card using html-to-image
      const canvas = await toCanvas(previewCardRef.current, {
        pixelRatio: 2.2, // high fidelity output
        backgroundColor: '#ffffff',
        cacheBust: true
      });

      // 2. Build PDF Document
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Match A4 proportions cleanly
      const pWidth = 210;
      const pHeight = 297;
      const margin = 10;
      const contentWidth = pWidth - (margin * 2); // 190mm
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight);
      
      // Dynamic clean file naming
      const formattedName = (customerName || 'customer')
        .replace(/\s+/g, '_')
        .substring(0, 15);
      const filename = `Memo_${memoNum}_${formattedName}.pdf`;
      
      pdf.save(filename);

      // 3. Post download action: Record memo to local database & increment serial for next transaction
      const record = archiveCurrentMemo(memoNum);
      
      if (autoIncrementOnDownload && serialStyle === 'sequential') {
        const nextSeq = currentSerialSequence + 1;
        setCurrentSerialSequence(nextSeq);
        localStorage.setItem('cashmemo_serial_seq', String(nextSeq));
        setMemoNum(String(nextSeq));
        showToast(`পিডিএফ ডাউনলোড সফল! মেমো #${record.memoNum} ইতিহাসে সংরক্ষিত হয়েছে। নতুন মেমো #${nextSeq} প্রস্তুত।`, 'success');
      } else if (autoIncrementOnDownload) {
        rollUniqueSerial();
        showToast(`পিডিএফ ডাউনলোড সফল! নতুন অনন্য সিরিয়াল নাম্বার জেনারেট হয়েছে।`, 'success');
      } else {
        showToast(`পিডিএফ ডাউনলোড সফল! মেমোটি ইতিহাসে যোগ করা হয়েছে।`, 'success');
      }
    } catch (error: any) {
      console.error('PDF export error:', error);
      showToast(`পিডিএফ তৈরি বা ডাউনলোডে সমস্যা হয়েছে: ${error?.message || 'নিরাপত্তা বা রিসোর্স জনিত সমস্যা'}`, 'error');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Export current memo as JPG Image
  const handleDownloadJPG = async () => {
    if (!previewCardRef.current) return;
    setDownloadingFormat('jpg');
    showToast('মেমো জেপিজি ছবি প্রস্তুত করা হচ্ছে...', 'info');

    try {
      const canvas = await toCanvas(previewCardRef.current, {
        pixelRatio: 2.5, // Ultra crisp JPG rendering
        backgroundColor: '#ffffff',
        cacheBust: true
      });

      const formattedName = (customerName || 'customer')
        .replace(/\s+/g, '_')
        .substring(0, 15);
      const filename = `Memo_${memoNum}_${formattedName}.jpg`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/jpeg', 0.95);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Store in History & Roll memo number
      const record = archiveCurrentMemo(memoNum);
      
      if (autoIncrementOnDownload && serialStyle === 'sequential') {
        const nextSeq = currentSerialSequence + 1;
        setCurrentSerialSequence(nextSeq);
        localStorage.setItem('cashmemo_serial_seq', String(nextSeq));
        setMemoNum(String(nextSeq));
        showToast(`জেপিজি ডাউনলোড সফল! মেমো #${record.memoNum} ইতিহাসে সংরক্ষিত হয়েছে। নতুন মেমো #${nextSeq} প্রস্তুত।`, 'success');
      } else if (autoIncrementOnDownload) {
        rollUniqueSerial();
        showToast(`জেপিজি ডাউনলোড সফল! নতুন অনন্য সিরিয়াল নাম্বার জেনারেট হয়েছে।`, 'success');
      } else {
        showToast(`জেপিজি ডাউনলোড সফল! মেমোটি ইতিহাসে যোগ করা হয়েছে।`, 'success');
      }
    } catch (error: any) {
      console.error('JPG export error:', error);
      showToast(`ছবি তৈরি করতে সমস্যা হয়েছে: ${error?.message || 'নিরাপত্তা বা রিসোর্স জনিত সমস্যা'}`, 'error');
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Load a historic memo record back into the active inputs
  const handleLoadFromHistory = (record: CashMemoData) => {
    setMemoNum(record.memoNum);
    setMemoDate(record.date);
    setCustomerName(record.customerName);
    setCustomerAddress(record.customerAddress);
    setCustomerMobile(record.customerMobile);
    setCondition1(record.condition1);
    setCondition2(record.condition2);
    setAdvance(record.advance);
    
    // Merge historical items back to full size array (10 rows)
    const fullItems = Array.from({ length: 10 }, (_, idx) => {
      if (record.items[idx]) {
        return record.items[idx];
      }
      return { desc: '', qty: '', rate: '', amt: '' };
    });
    setItems(fullItems);
    
    setActiveTab('editor');
    showToast(`মেমো #${record.memoNum} মূল এডিটরে লোড করা হয়েছে!`, 'success');
  };

  // Delete historic record
  const handleDeleteHistory = (recordId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // prevent loading memo
    if (window.confirm('আপনি কি নিশ্চিত যে এই মেমোটি ইতিহাস থেকে মুছে ফেলতে চান?')) {
      const filtered = historyList.filter(item => item.id !== recordId);
      setHistoryList(filtered);
      localStorage.setItem('cashmemo_history', JSON.stringify(filtered));
      showToast('মেমোটি ইতিহাস থেকে ডিলেট করা হয়েছে।', 'error');
    }
  };

  // Preset Customizer Helpers
  const addPreset = (name: string, rate: string) => {
    if (!name.trim()) return;
    const newPreset: ProductPreset = {
      id: Math.random().toString(),
      name,
      defaultRate: rate
    };
    const updated = [...presets, newPreset];
    setPresets(updated);
    showToast('নতুন পন্য প্রিসেট সফলভাবে সংরক্ষিত!', 'success');
  };

  const removePreset = (id: string) => {
    const updated = presets.filter(p => p.id !== id);
    setPresets(updated);
    showToast('প্রিসেট পনটি মুছে ফেলা হয়েছে।', 'info');
  };

  // Compute analytics from historical data
  const totalMemosCount = historyList.length;
  const totalBilledAmount = historyList.reduce((sum, item) => sum + item.grossTotal, 0);
  const totalCollectedAdvance = historyList.reduce((sum, item) => sum + (parseFloat(item.advance) || 0), 0);
  const totalDueRemaining = historyList.reduce((sum, item) => sum + item.balanceDue, 0);

  // Filtered history list matching search string
  const filteredHistory = historyList.filter(item => {
    const searchString = historySearch.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(searchString) ||
      item.memoNum.includes(searchString) ||
      item.customerMobile.includes(searchString) ||
      item.customerAddress.toLowerCase().includes(searchString)
    );
  });

  return (
    <div className="min-h-screen bg-[#F4FBFB] flex flex-col antialiased text-[#1D1D1F]">
      {/* Toast Alert Banner */}
      {saveToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all animate-bounce max-w-md border backdrop-blur-md"
          style={{
            backgroundColor: saveToast.type === 'success' ? 'rgba(222, 247, 236, 0.95)' : saveToast.type === 'error' ? 'rgba(253, 232, 232, 0.95)' : 'rgba(225, 245, 254, 0.95)',
            color: saveToast.type === 'success' ? '#03543f' : saveToast.type === 'error' ? '#9b1c1c' : '#0288d1',
            borderColor: saveToast.type === 'success' ? 'rgba(189, 236, 182, 0.6)' : saveToast.type === 'error' ? 'rgba(248, 180, 180, 0.6)' : 'rgba(179, 229, 252, 0.6)',
          }}
        >
          {saveToast.type === 'success' ? <Check size={18} /> : saveToast.type === 'error' ? <Trash2 size={18} /> : <Sparkles size={18} />}
          <span className="text-sm font-semibold">{saveToast.message}</span>
        </div>
      )}

      {/* Main Premium Application Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#007AFF]/10 text-[#007AFF] rounded-2xl">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#007AFF] leading-none mb-1">
                Cash Memo Utility
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#1D1D1F]">
                Print Solutions <span className="text-[#007AFF] font-medium">Pro</span>
              </h1>
            </div>
          </div>
          
          {/* Quick Stats Header Cards - Visible only on Desktop */}
          <div className="hidden lg:flex items-center gap-5 bg-slate-50/80 px-4 py-2 rounded-2xl border border-slate-200/50 text-xs">
            <div className="px-1 py-0.5">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">মোট মেমো সংখ্যা</span>
              <span className="text-sm font-extrabold text-slate-800">{toBengaliNum(totalMemosCount)} টি</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="px-1 py-0.5">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">মোট বিক্রয়</span>
              <span className="text-sm font-extrabold text-emerald-600">৳ {toBengaliNum(totalBilledAmount)}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="px-1 py-0.5">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">অগ্রিম সংগ্রহ</span>
              <span className="text-sm font-extrabold text-[#007AFF]">৳ {toBengaliNum(totalCollectedAdvance)}</span>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="px-1 py-0.5">
              <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[9px] mb-0.5">বকেয়া পাওনা</span>
              <span className="text-sm font-extrabold text-red-500">৳ {toBengaliNum(totalDueRemaining)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={handleNewTransaction}
              className="flex items-center gap-2 bg-[#007AFF] hover:bg-[#0066CC] active:scale-95 text-white font-semibold text-xs px-4 py-2.5 rounded-2xl transition-all shadow-sm shadow-[#007AFF]/10 hover:shadow"
            >
              <Plus size={15} />
              নতুন মেমো বোর্ড
            </button>
          </div>
        </div>
      </header>

      {/* Main Core Layout Grid */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls / Forms panel (Takes 5 cols on desktop) */}
        <section className="lg:col-span-5 space-y-5 flex flex-col h-full lg:max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 scrollbar-thin">
          
          {/* Mobile Tab bar: Fixed at top of form section on small devices */}
          <div className="flex bg-white/90 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200/60 lg:hidden">
            <button 
              onClick={() => setActiveTab('editor')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'editor' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Edit size={14} />
              তথ্য পূরণ
            </button>
            <button 
              onClick={() => setActiveTab('preview')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'preview' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Eye size={14} />
              লাইভ মেমো
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'history' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <History size={14} />
              ইতিহাস ({historyList.length})
            </button>
            <button 
              onClick={() => setActiveTab('profile')}
              className={`flex-1 flex justify-center items-center gap-1.5 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'profile' ? 'bg-[#007AFF] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Settings size={14} />
              প্রতিষ্ঠান
            </button>
          </div>

          {/* Tab 1: EDIT TRANSACTION FORM PANEL (Visible on both desktop OR when activeTab is editor on mobile) */}
          <div className={`space-y-5 ${activeTab === 'editor' ? 'block' : 'hidden lg:block'}`}>
            
            {/* Quick Presets Sub-Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60">
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles size={14} className="text-[#007AFF]" />
                <h3 className="text-[10px] font-black text-slate-400 tracking-wider uppercase">পণ্য প্রিসেট (Quick Add)</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {presets.map(p => (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className="text-xs bg-slate-50 hover:bg-[#007AFF]/5 hover:border-[#007AFF]/30 border border-slate-200/60 text-slate-700 font-semibold px-2.5 py-1.5 rounded-xl flex items-center gap-1 pr-3 transition-all duration-200 active:scale-[0.97]"
                  >
                    <Plus size={11} className="text-[#007AFF]" />
                    <span>{p.name} (৳{p.defaultRate})</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setActiveTab('presets');
                    showToast('প্রিসেট ম্যানেজারে আপনাকে স্বাগত!', 'info');
                  }}
                  className="text-xs text-[#007AFF] font-bold hover:underline px-2.5 py-1.5"
                >
                  కাস্টমাইজ প্রিসেট →
                </button>
              </div>
            </div>

            {/* Client Bio Input Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <User size={16} className="text-[#007AFF]" />
                  ক্রেতার বিবরণ ও মেমো নং
                </h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">CLIENT INFO</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">ক্যাশ মেমো নং</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={memoNum}
                      onChange={(e) => setMemoNum(e.target.value)}
                      placeholder="912"
                      className="w-full pl-3 pr-8 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-bold text-slate-850 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                    />
                    <button 
                      onClick={() => { rollUniqueSerial(); showToast('অনন্য মেমো নম্বর রোল করা হয়েছে!', 'info'); }}
                      title="নতুন নাম্বার জেনারেট করুন"
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-[#007AFF] transition-all duration-200 hover:rotate-180"
                    >
                      <RotateCw size={13} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">তারিখ</label>
                  <input 
                    type="date" 
                    value={memoDate}
                    onChange={(e) => setMemoDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-700 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">ক্রেতার নাম (বাংলায় বা বড় হাতে)</label>
                  <input 
                    type="text" 
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="উদাঃ আবু বকর"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-850 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">ঠিকানা</label>
                  <input 
                    type="text" 
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder="উদাঃ মিরপুর-১, ঢাকা"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-850 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">মোবাইল নম্বর</label>
                  <input 
                    type="tel" 
                    value={customerMobile}
                    onChange={(e) => setCustomerMobile(e.target.value)}
                    placeholder="উদাঃ 01789848646"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-bold text-slate-850 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Billable Items Inputs Multi-Row Sheet */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-[#007AFF]" />
                  মালের বিবরণী ও দর দাম (সর্বমোট ১০ লাইন)
                </h3>
                <button
                  onClick={resetItemsList}
                  className="text-xs text-red-500 font-bold hover:underline hover:opacity-80 transition-all"
                >
                  খালি করুন
                </button>
              </div>

              {/* Scrollable Container for editing items in Mobile view easily */}
              <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                {items.map((item, idx) => (
                  <div key={idx} className="bg-slate-50/60 border border-slate-100 rounded-2xl p-3 space-y-2.5 relative transition-all hover:bg-slate-50">
                    <div className="flex justify-between items-center bg-[#007AFF]/5 px-2.5 py-1 rounded-xl">
                      <span className="text-[10px] font-black text-[#007AFF] uppercase tracking-wider">লাইন {toBengaliNum(idx + 1)}</span>
                      {item.amt ? (
                        <span className="text-xs font-black text-emerald-600">৳ {toBengaliNum(item.amt)}</span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">তথ্য নেই</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-12 gap-2">
                      <div className="col-span-6">
                        <input 
                          type="text" 
                          value={item.desc}
                          onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                          placeholder="মালের বিবরণ (উদাঃ T shirt)"
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] transition-all outline-none text-slate-800 font-medium"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" 
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                          placeholder="পরিমাণ"
                          title="পরিমাণ"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] transition-all outline-none text-center text-slate-800 font-bold"
                        />
                      </div>
                      <div className="col-span-3">
                        <input 
                          type="number" 
                          value={item.rate}
                          onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                          placeholder="দর"
                          title="দর"
                          className="w-full px-2 py-1.5 bg-white border border-slate-200/80 rounded-xl text-xs focus:ring-4 focus:ring-[#007AFF]/10 focus:border-[#007AFF] transition-all outline-none text-center text-slate-800 font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations and Terms Section */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={16} className="text-[#007AFF]" />
                  অগ্রিম, কন্ডিশন ও শর্তাবলী
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">কন্ডিশন লাইন ১</label>
                  <input 
                    type="text" 
                    value={condition1}
                    onChange={(e) => setCondition1(e.target.value)}
                    placeholder="হালিম পরিবহন কুরিয়ার"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">কন্ডিশন লাইন ২</label>
                  <input 
                    type="text" 
                    value={condition2}
                    onChange={(e) => setCondition2(e.target.value)}
                    placeholder="উদাঃ কন্ডিশন ৫০০ টাকা বাকী"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1.5 block">অগ্রিম পরিশোধকৃত টাকা (টাকায় লিখুন)</label>
                <div className="relative border-b border-transparent">
                  <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">৳</span>
                  <input 
                    type="number" 
                    value={advance}
                    onChange={(e) => setAdvance(e.target.value)}
                    placeholder="2000"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-extrabold focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none text-[#007AFF]"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Summary Indicator in control list */}
              <div className="bg-[#007AFF]/5 rounded-2xl p-4 grid grid-cols-3 text-center gap-2 border border-[#007AFF]/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block mb-0.5">সর্বমোট</span>
                  <span className="text-sm font-black text-slate-800">৳{toBengaliNum(grossTotal)}</span>
                </div>
                <div className="border-x border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block mb-0.5">অগ্রিম জমা</span>
                  <span className="text-sm font-black text-emerald-600">৳{toBengaliNum(parseFloat(advance) || 0)}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-405 tracking-wider block mb-0.5">অবশিষ্ট বাকী</span>
                  <span className="text-sm font-black text-red-500">৳{toBengaliNum(balanceDue)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 2: HISTORY LOG PANEL */}
          <div className={`bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4 ${activeTab === 'history' ? 'block' : 'hidden lg:hidden'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History size={16} className="text-[#007AFF]" />
                সংরক্ষিত মালের চালান ইতিহাস ({historyList.length})
              </h3>
            </div>

            {/* Quick Stats Grid inside tab */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
              <div className="p-2.5 bg-white rounded-xl text-center shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">মোট বিক্রয়</span>
                <span className="text-xs font-black text-[#007AFF]">৳ {toBengaliNum(totalBilledAmount)}</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl text-center shadow-[0_4px_12px_rgba(0,0,0,0.015)]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">মোট বকেয়া</span>
                <span className="text-xs font-black text-red-500">৳ {toBengaliNum(totalDueRemaining)}</span>
              </div>
            </div>

            {/* Search Input bar */}
            <div className="relative">
              <input 
                type="text" 
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="নাম, মেমো বা মোবাইল লিখে খুঁজুন..."
                className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
              />
            </div>

            {/* History Table list */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin">
              {filteredHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  <AlertCircle size={28} className="mx-auto text-slate-300 mb-1" />
                  সার্চের সাথে সামঞ্জস্যপূর্ণ কোনো মেমো পাওয়া যায়নি।
                </div>
              ) : (
                filteredHistory.map(record => (
                  <div 
                    key={record.id}
                    onClick={() => handleLoadFromHistory(record)}
                    className="border border-slate-100 hover:border-[#007AFF]/30 hover:bg-[#007AFF]/5 transition-all p-3.5 rounded-2xl cursor-pointer shadow-[0_4px_15px_rgba(0,0,0,0.005)] relative group bg-white"
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#007AFF]/10 text-[#007AFF] text-[9px] font-black px-2 py-0.5 rounded-md">
                          নং-{record.memoNum}
                        </span>
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">
                          {record.customerName}
                        </span>
                      </div>
                      
                      <button 
                        onClick={(e) => handleDeleteHistory(record.id, e)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded-lg transition-colors bg-slate-50 border border-transparent hover:border-red-100"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 text-[10px] text-slate-500 mb-1.5 gap-x-1.5 gap-y-0.5">
                      <div>📱 {record.customerMobile}</div>
                      <div className="text-right">📅 {toBengaliNum(record.date)}</div>
                      <div className="col-span-2 text-slate-400 truncate">📍 {record.customerAddress}</div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] uppercase font-bold tracking-wide pt-1.5 border-t border-slate-100 text-slate-400">
                      <div>পণ্য: <span className="font-extrabold text-slate-700">{toBengaliNum(record.items.length)} টি</span></div>
                      <div>
                        বকেয়া: <span className={`font-extrabold ${record.balanceDue > 0 ? 'text-red-500' : 'text-emerald-600'}`}>৳{toBengaliNum(record.balanceDue)}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Tab 3: COMPANY SETTINGS & PROFILE CUSTOMIZATION */}
          <div className={`bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4 ${activeTab === 'profile' ? 'block' : 'hidden lg:hidden'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Settings size={16} className="text-[#007AFF]" />
                মেমো প্রোফাইল ও সেটিংস
              </h3>
            </div>

            <p className="text-[10px] font-semibold text-slate-500 leading-relaxed bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
              এখানে আপনার নিজস্ব ব্যবসা বা সেবা প্রতিষ্ঠানের নাম, লোগো, ফোন নম্বর এবং ঠিকানা পরিবর্তন করে ক্যাশ মেমো পোর্টালকে আপনার নিজের মেমো জেনারেটরে রুপান্তর করতে পারেন।
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">প্রতিষ্ঠানের নাম (বাংলা)</label>
                <input 
                  type="text" 
                  value={profile.shopName}
                  onChange={(e) => setProfile({ ...profile, shopName: e.target.value })}
                  placeholder="প্রিন্ট সলিউশন্স"
                  className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">প্রোপ্রাইটর</label>
                  <input 
                    type="text" 
                    value={profile.proprietorName}
                    onChange={(e) => setProfile({ ...profile, proprietorName: e.target.value })}
                    placeholder="প্রোঃ মেহেদী হাসান নাবিল"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">ওয়েবসাইট এড্রেস</label>
                  <input 
                    type="text" 
                    value={profile.websiteUrl}
                    onChange={(e) => setProfile({ ...profile, websiteUrl: e.target.value })}
                    placeholder="www.printsolutionsbd.com"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">মোবাইল ১</label>
                  <input 
                    type="text" 
                    value={profile.mobile1}
                    onChange={(e) => setProfile({ ...profile, mobile1: e.target.value })}
                    placeholder="01711-458715"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">মোবাইল ২</label>
                  <input 
                    type="text" 
                    value={profile.mobile2}
                    onChange={(e) => setProfile({ ...profile, mobile2: e.target.value })}
                    placeholder="01716-002215"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-bold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">লোগো ছবি লিঙ্ক বা আপলোড (CORS সমৃদ্ধ বা base64)</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="text" 
                    value={profile.logoUrl}
                    onChange={(e) => setProfile({ ...profile, logoUrl: e.target.value })}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                  <label className="cursor-pointer shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all border border-slate-200/50 flex items-center gap-1.5 active:scale-95">
                    <Plus size={14} className="text-[#007AFF]" />
                    <span>আপলোড করুন</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            if (event.target?.result) {
                              setProfile({ ...profile, logoUrl: event.target.result as string });
                              showToast('লোগো সফলভাবে আপলোড হয়েছে!', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">বিবরণ / সেবা সমূহ</label>
                <textarea 
                  rows={3}
                  value={profile.services}
                  onChange={(e) => setProfile({ ...profile, services: e.target.value })}
                  placeholder="উন্নতমানের টি-শার্ট..."
                  className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">প্রতিষ্ঠানের ঠিকানা</label>
                <textarea 
                  rows={2}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Sidique Bazar Dhaka"
                  className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-medium text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none resize-none"
                />
              </div>

              <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
                <h4 className="text-[11px] font-black uppercase text-slate-700 tracking-wider">মেমো সিরিয়াল নাম্বার পলিসি</h4>
                
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">অনন্যতা পদ্ধতি</label>
                  <select
                    value={serialStyle}
                    onChange={(e: any) => setSerialStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  >
                    <option value="sequential">সিকোয়েনশিয়াল ১ করে বাড়বে (উদাঃ ৯১২, ৯১৩)</option>
                    <option value="random">৪ ডিজিটের র্যান্ডম অনন্য নাম্বার</option>
                    <option value="timed">তারিখের কোড নাম্বার (উদাঃ ২৬০৬১৩-১২২৪)</option>
                  </select>
                </div>

                {serialStyle === 'sequential' && (
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-404 tracking-wider mb-1.5">বর্তমান সিরিয়াল সিকুয়েন্স শুরু</label>
                    <input 
                      type="number" 
                      value={currentSerialSequence}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10) || 0;
                        setCurrentSerialSequence(val);
                        localStorage.setItem('cashmemo_serial_seq', String(val));
                        setMemoNum(String(val));
                      }}
                      className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-black focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none text-[#007AFF]"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2.5 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input
                    type="checkbox"
                    id="auto-inc-download"
                    checked={autoIncrementOnDownload}
                    onChange={(e) => setAutoIncrementOnDownload(e.target.checked)}
                    className="h-4 w-4 rounded-md border-slate-350 text-[#007AFF] focus:ring-[#007AFF]/20 transition-all cursor-pointer bg-white"
                  />
                  <label htmlFor="auto-inc-download" className="text-[10px] text-slate-500 font-bold uppercase cursor-pointer selection:bg-transparent">
                    ডাউনলোড করার সাথে সাথে পরবর্তী মেমো নম্বর আপডেট করুন
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Tab 4: PRESET CONFIG MANAGER */}
          <div className={`bg-white/90 backdrop-blur-md rounded-3xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.015)] border border-slate-200/60 space-y-4 ${activeTab === 'presets' ? 'block' : 'hidden'}`}>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                পণ্য প্রিসেট তালিকা কাস্টমাইজ
              </h3>
              <button
                onClick={() => setActiveTab('editor')}
                className="text-xs text-[#007AFF] font-bold hover:underline"
              >
                এডিটরে ফিরে যান
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] uppercase font-bold text-slate-404 tracking-wider">নতুন প্রিসেট পন্য যোগ করুন:</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const nameInp = form.elements.namedItem('pname') as HTMLInputElement;
                const rateInp = form.elements.namedItem('prate') as HTMLInputElement;
                addPreset(nameInp.value, rateInp.value || '0');
                form.reset();
              }} className="grid grid-cols-12 gap-2">
                <div className="col-span-6">
                  <input
                    required
                    type="text"
                    name="pname"
                    placeholder="পন্যের নাম বা টাইপ"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-800 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    required
                    type="number"
                    name="prate"
                    placeholder="ডিফল্ট দর (৳)"
                    className="w-full px-3 py-2 bg-slate-50/80 border border-transparent rounded-xl text-xs font-semibold text-slate-850 focus:ring-4 focus:ring-[#007AFF]/10 focus:bg-white focus:border-[#007AFF] transition-all outline-none text-center font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="col-span-2 bg-[#007AFF] text-white hover:bg-[#007AFF]/95 active:scale-95 text-xs font-bold rounded-xl flex items-center justify-center py-2 transition-all shadow-sm"
                >
                  <Plus size={16} />
                </button>
              </form>

              <div className="pt-2.5 border-t border-slate-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-404 tracking-wider block">বর্তমান প্রিসেট পণ্যসমূহ:</span>
                <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                  {presets.map(p => (
                    <div key={p.id} className="flex justify-between items-center text-xs bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                      <span className="font-medium text-slate-700">{p.name} — <span className="font-extrabold text-[#007AFF]">৳{toBengaliNum(p.defaultRate)}</span></span>
                      <button
                        onClick={() => removePreset(p.id)}
                        className="text-slate-400 hover:text-red-500 p-1 bg-white hover:bg-red-50 rounded-lg transition-colors border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.01)]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* RIGHT COLUMN: Real-Time Cash Memo Preview (Takes 7 cols on desktop) */}
        <section className={`lg:col-span-7 flex flex-col items-center justify-center ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          
          <div className="w-full max-w-[720px] bg-white rounded-3xl p-5 shadow-[0_12px_45px_rgba(0,0,0,0.015)] border border-slate-200/60 flex flex-col gap-4">
            
            <div className="flex justify-between items-center bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                <Eye size={15} className="text-[#007AFF]" />
                লাইভ ফাইনাল ক্যাশ মেমো (PDF/JPG প্রিভিউ)
              </span>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloadingFormat !== null}
                  className="flex items-center gap-1.5 bg-[#007AFF] hover:bg-[#0062CC] text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,122,255,0.15)] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {downloadingFormat === 'pdf' ? (
                    <RefreshCcw size={12} className="animate-spin" />
                  ) : (
                    <FileText size={12} />
                  )}
                  <span>📄 PDF কার্বন</span>
                </button>
                <button
                  onClick={handleDownloadJPG}
                  disabled={downloadingFormat !== null}
                  className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[11px] px-3.5 py-2 rounded-xl transition-all shadow-[0_4px_12px_rgba(0,0,0,0.1)] active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {downloadingFormat === 'jpg' ? (
                    <RefreshCcw size={12} className="animate-spin" />
                  ) : (
                    <Download size={12} />
                  )}
                  <span>🖼️ JPG মেমো</span>
                </button>
              </div>
            </div>

            {/* THE VISUAL CASH MEMO CARD PRINT STAGE (To capture via html2canvas precisely) */}
            <div className="border border-slate-100 bg-[#F4FBFB]/50 p-4.5 rounded-2xl flex justify-center items-center overflow-x-auto select-none">
              <div 
                ref={previewCardRef}
                id="memo-card" 
                className="bg-white min-w-[680px] w-[680px] min-h-[820px] mx-auto text-slate-900 overflow-hidden relative shadow-[0_12px_45px_rgba(0,0,0,0.02)] rounded-2xl border border-slate-100"
                style={{ fontFamily: '"Noto Sans Bengali", sans-serif' }}
              >
                
                {/* 1. HEADER SECTION (with background color themed #1a5fa8 by default) */}
                <div 
                  className="p-3 flex justify-between items-center relative text-white select-none"
                  style={{ backgroundColor: profile.colorTheme.primary }}
                >
                  <div className="w-[12%] flex items-center justify-start">
                    {profile.logoUrl ? (
                      <img 
                        src={profile.logoUrl} 
                        alt="Logo" 
                        crossOrigin="anonymous" 
                        referrerPolicy="no-referrer"
                        className="h-[52px] w-auto max-w-[80px] rounded object-contain bg-white/10"
                        onError={(e) => {
                          // Fallback gracefully on CORS issue
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="h-10 w-10 bg-white/20 rounded flex items-center justify-center font-bold text-lg">P</div>
                    )}
                  </div>
                  
                  {/* Cenetered shop title */}
                  <div className="w-[60%] text-center">
                    <h2 className="text-[28px] font-extrabold tracking-tight leading-none text-white drop-shadow-sm font-bengali">
                      {profile.shopName}
                    </h2>
                  </div>

                  {/* Right Contact Details */}
                  <div className="w-[28%] text-right text-[11px] font-medium leading-normal space-y-0.5">
                    <div className="flex items-center justify-end gap-1">
                      <span>📱 মোবাঃ</span> 
                      <b className="font-bold text-[11.5px] font-sans">{profile.mobile1}</b>
                    </div>
                    {profile.mobile2 && (
                      <div className="flex items-center justify-end gap-1">
                        <span>📱</span> 
                        <b className="font-bold text-[11.5px] font-sans">{profile.mobile2}</b>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. SUBHEADER SECTION */}
                <div 
                  className="py-2.5 px-4 text-center border-b border-[#1a5fa8]"
                  style={{ 
                    backgroundColor: profile.colorTheme.glow,
                    borderBottomColor: profile.colorTheme.primary 
                  }}
                >
                  <div 
                    className="font-bold text-[12.5px] mb-1"
                    style={{ color: profile.colorTheme.primary }}
                  >
                    {profile.proprietorName}
                  </div>
                  
                  {/* Services tags */}
                  <p className="text-[10px] text-slate-800 leading-relaxed font-semibold whitespace-pre-line max-w-[620px] mx-auto">
                    {profile.services}
                  </p>
                  
                  {/* Address info */}
                  <p 
                    className="text-[10.5px] font-bold mt-1 max-w-[620px] mx-auto leading-relaxed"
                    style={{ color: profile.colorTheme.primary }}
                  >
                    {profile.address}
                  </p>
                </div>

                {/* 3. MEMO TITLE STRIP & UNIQUE SERIAL BAR */}
                <div 
                  className="py-1.5 px-4 flex justify-between items-center border-b"
                  style={{ borderBottomColor: profile.colorTheme.primary }}
                >
                  <div className="flex items-center gap-2">
                    <span 
                      className="text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded"
                      style={{ backgroundColor: profile.colorTheme.primary }}
                    >
                      ক্যাশ মেমো/চালান
                    </span>
                    <span className="text-[11.5px] text-slate-600 font-bold">নং-</span>
                    <span 
                      className="text-[15px] font-extrabold"
                      style={{ color: profile.colorTheme.primary }}
                    >
                      {toBengaliNum(memoNum)}
                    </span>
                    {profile.websiteUrl && (
                      <span className="text-[10.5px] font-bold ml-3 text-slate-500 font-sans tracking-wide">
                        {profile.websiteUrl}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span 
                      className="text-white text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: profile.colorTheme.primary }}
                    >
                      তারিখ
                    </span>
                    
                    {/* Flat Borderless/Minimal Input style exactly matching the image */}
                    <div className="border-b border-[#1a5fa8] px-2 py-0.5 text-xs font-bold text-slate-800 select-all tracking-wide bg-transparent outline-none">
                      {toBengaliNum(memoDate)}
                    </div>
                  </div>
                </div>

                {/* 4. CUSTOMER PROFILE INFORMATION BAR */}
                <div 
                  className="p-3 grid grid-cols-12 gap-y-2.5 gap-x-3 border-b text-slate-800 select-text"
                  style={{ borderBottomColor: profile.colorTheme.primary }}
                >
                  {/* Name field */}
                  <div className="col-span-12 flex items-center gap-2">
                    <span 
                      className="text-white text-[10.5px] font-bold px-2 py-0.5 rounded min-w-[55px] text-center"
                      style={{ backgroundColor: profile.colorTheme.primary }}
                    >
                      নাম
                    </span>
                    <div className="flex-1 border-b border-dashed border-[#1a5fa8]/50 px-2 py-0.5 text-xs font-semibold select-text text-left">
                      {customerName || <span className="text-slate-300 italic text-[11px]">গ্রাহকের নাম লিখুন...</span>}
                    </div>
                  </div>

                  {/* Address details */}
                  <div className="col-span-12 flex items-center gap-2">
                    <span 
                      className="text-white text-[10.5px] font-bold px-2 py-0.5 rounded min-w-[55px] text-center"
                      style={{ backgroundColor: profile.colorTheme.primary }}
                    >
                      ঠিকানা
                    </span>
                    <div className="flex-1 border-b border-dashed border-[#1a5fa8]/50 px-2 py-0.5 text-xs font-semibold select-text text-left">
                      {customerAddress || <span className="text-slate-300 italic text-[11px]">ঠিকানা লিখুন...</span>}
                    </div>
                  </div>

                  {/* Mobile container */}
                  <div className="col-span-12 flex items-center gap-2">
                    <span 
                      className="text-white text-[10.5px] font-bold px-2 py-0.5 rounded min-w-[55px] text-center"
                      style={{ backgroundColor: profile.colorTheme.primary }}
                    >
                      মোবাইলঃ
                    </span>
                    <div className="flex-1 border-b border-dashed border-[#1a5fa8]/50 px-2 py-0.5 text-xs font-bold select-text text-left font-sans text-slate-800">
                      {customerMobile || <span className="text-slate-300 italic text-[11px] font-bengali font-normal">মোবাইল নম্বর লিখুন...</span>}
                    </div>
                  </div>
                </div>

                {/* 5. MEMO BILLABLE ITEMS TABLE */}
                <div className="w-full">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr 
                        className="text-white text-xs"
                        style={{ backgroundColor: profile.colorTheme.primary }}
                      >
                        <th className="py-1.5 px-2 border-r border-white/20 w-[42px] font-semibold text-center">সংখ্যা</th>
                        <th className="py-1.5 px-3 border-r border-white/20 text-left font-semibold">মালের বিবরণ</th>
                        <th className="py-1.5 px-1.5 border-r border-white/20 w-[72px] font-semibold text-center">পরিমাণ</th>
                        <th className="py-1.5 px-1.5 border-r border-white/20 w-[68px] font-semibold text-center">দর</th>
                        <th className="py-1.5 px-3 w-[86px] font-semibold text-center">টাকা</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr 
                          key={idx}
                          className="border-b transition-colors"
                          style={{ 
                            borderBottomColor: '#b8d4f0',
                            backgroundColor: idx % 2 === 1 ? '#f0f7ff' : '#ffffff' 
                          }}
                        >
                          {/* Item serial index in Bengali (০১, ০২...) */}
                          <td className="py-1 font-bold text-[11.5px] text-center text-slate-700 select-none">
                            {BENGALI_INDICES[idx]}
                          </td>
                          
                          {/* Item Name */}
                          <td className="px-3 py-1 text-xs select-text text-left font-medium min-h-[22px]">
                            {item.desc ? (
                              <span className="text-slate-900">{item.desc}</span>
                            ) : (
                              <span className="text-transparent">—</span>
                            )}
                          </td>
                          
                          {/* Quantity */}
                          <td className="py-1 font-semibold text-xs text-center text-slate-800">
                            {item.qty ? toBengaliNum(item.qty) : ''}
                          </td>
                          
                          {/* Rate price */}
                          <td className="py-1 font-semibold text-xs text-center text-slate-800">
                            {item.rate ? toBengaliNum(item.rate) : ''}
                          </td>
                          
                          {/* Subtotal calculated value */}
                          <td className="px-3 py-1 font-bold text-xs text-right text-slate-800 w-[86px]">
                            {item.amt ? toBengaliNum(item.amt) : ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 6. CONFINING CONDITIONS AND TOTAL CALCULATIONS GRID */}
                <div 
                  className="grid grid-cols-12 border-t-2"
                  style={{ borderTopColor: profile.colorTheme.primary }}
                >
                  
                  {/* Left Column: Terms / Transport / Condition description */}
                  <div 
                    className="col-span-6 p-2 border-r"
                    style={{ borderRightColor: profile.colorTheme.primary }}
                  >
                    <div className="mb-1.5">
                      <span 
                        className="text-white text-[9.5px] font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: profile.colorTheme.primary }}
                      >
                        কন্ডিশনঃ
                      </span>
                    </div>
                    
                    {/* Condition lines looking identical to the flat image layout */}
                    <div className="space-y-1.5 py-1 text-[11px] font-semibold text-slate-800">
                      <div className="border-b border-dashed border-[#1a5fa8]/35 min-h-[18px] px-1 select-text">
                        {condition1 || <span className="text-slate-200 select-none">পরিবহন বা কুরিয়ার কন্ডিশন...</span>}
                      </div>
                      <div className="border-b border-dashed border-[#1a5fa8]/35 min-h-[18px] px-1 select-text">
                        {condition2 || <span className="text-slate-200 select-none">শর্তাবলী লাইন ২...</span>}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Invoice financial statement totals balance */}
                  <div className="col-span-6 p-2 space-y-1.5 select-all">
                    
                    {/* Gross */}
                    <div className="flex justify-between items-center gap-1.5">
                      <span 
                        className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[42px] text-center"
                        style={{ backgroundColor: profile.colorTheme.primary }}
                      >
                        মোট-
                      </span>
                      <div className="flex-1 border-b border-[#1a5fa8] px-2 py-0.5 text-right font-extrabold text-slate-905 font-sans leading-none">
                        {toBengaliNum(grossTotal)}
                      </div>
                    </div>

                    {/* Advance paid */}
                    <div className="flex justify-between items-center gap-1.5">
                      <span 
                        className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[42px] text-center"
                        style={{ backgroundColor: profile.colorTheme.primary }}
                      >
                        অগ্রিম-
                      </span>
                      <div className="flex-1 border-b border-[#1a5fa8] px-2 py-0.5 text-right font-extrabold text-indigo-900 font-sans leading-none">
                        {toBengaliNum(parseFloat(advance) || 0)}
                      </div>
                    </div>

                    {/* Due remain */}
                    <div className="flex justify-between items-center gap-1.5">
                      <span 
                        className="text-white text-[9px] font-bold px-1.5 py-0.5 rounded min-w-[42px] text-center"
                        style={{ backgroundColor: profile.colorTheme.primary }}
                      >
                        বাকী-
                      </span>
                      <div className="flex-1 border-b border-[#1a5fa8] px-2 py-0.5 text-right font-extrabold text-[#1a5fa8] font-sans leading-none">
                        {toBengaliNum(balanceDue)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* REAL-TIME IN-WORDS CONVERSION BLOCK */}
                <div className="px-4 py-1.5 border-t border-slate-200/60 bg-slate-50 flex items-center text-xs text-slate-800">
                  <span className="font-bold text-[#1a5fa8] shrink-0 mr-1.5">কথায়ঃ</span>
                  <span className="font-bold text-slate-700 select-all">
                    {grossTotal > 0 ? toBengaliWords(grossTotal) : 'শূণ্য টাকা মাত্র'}
                  </span>
                </div>

                {/* 7. ATTENTION RULES / REGISTRATION INSTRUCTION BANNER */}
                <div 
                  className="p-1 px-4 text-[9.5px] font-bold font-bengali text-center leading-normal border-t border-b select-none"
                  style={{ 
                    backgroundColor: profile.colorTheme.glow,
                    color: profile.colorTheme.primary,
                    borderColor: profile.colorTheme.primary
                  }}
                >
                  {'{ ' + profile.noticeLine1 + ' }'}<br />
                  {'{ ' + profile.noticeLine2 + ' }'}
                </div>

                {/* 8. SIGNATURE LINE BAR */}
                <div className="px-4 py-4.5 flex justify-between items-center select-none bg-white">
                  <div className="text-[10px] text-slate-700">
                    <span className="font-semibold">ক্রেতার স্বাক্ষর:</span> 
                    <span className="inline-block w-28 ml-1 border-b border-slate-800" />
                  </div>

                  <div 
                    className="text-white text-[10px] font-bold px-3 py-1 rounded"
                    style={{ backgroundColor: profile.colorTheme.primary }}
                  >
                    বিঃদ্রঃ বিক্রিত মাল ফেরত নেওয়া হয় না।
                  </div>

                  <div className="text-[10px] text-slate-700 text-right">
                    <span className="font-semibold">স্বাক্ষর:</span> 
                    <span className="inline-block w-28 ml-1 border-b border-slate-800" />
                  </div>
                </div>

              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 select-none flex items-center justify-center gap-1">
              <Sparkles size={11} className="text-cyan-600" />
              <span>এটাই আসল প্রিন্ট লেআউট। পিডিএফ ও ছবি ডাউনলোড করার পরে এটি ঠিক এমনই হাই-রেজোলিউশন দেখাবে।</span>
            </div>

          </div>
        </section>

      </main>

      {/* FOOTER METRICS INFO AND HELP GUIDE */}
      <footer className="py-6 select-none border-t border-slate-200/40 bg-white/40 mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-2 text-xs text-slate-400 font-medium">
          <div>
            <b>Print Solutions Cash Memo Portal</b> • মোবাইল ও রেসপন্সিভ ক্যাশ মেমো পোর্টাল
          </div>
          <div>
            @ {new Date().getFullYear()} • Dynamic Unique Memo PDF & JPG Engine
          </div>
        </div>
      </footer>

      {/* MOBILE EASY VIEW PANEL BOTTOM NAVIGATION - sticky on bottom of small screen viewports */}
      <nav className="sticky bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-slate-200/80 p-2.5 text-slate-800 lg:hidden flex justify-around items-center z-40 shadow-[0_-8px_30px_rgba(0,0,0,0.02)]">
        <button 
          onClick={() => { setActiveTab('editor'); }} 
          className={`flex flex-col items-center p-1 font-bold transition-all ${activeTab === 'editor' ? 'text-[#007AFF]' : 'text-slate-400'}`}
        >
          <Edit size={18} />
          <span className="text-[10px] mt-0.5">পূরণ করুন</span>
        </button>
        <button 
          onClick={() => { setActiveTab('preview'); }} 
          className={`flex flex-col items-center p-1 font-bold transition-all ${activeTab === 'preview' ? 'text-[#007AFF]' : 'text-slate-400'}`}
        >
          <Eye size={18} />
          <span className="text-[10px] mt-0.5">লাইভ প্রিভিউ</span>
        </button>
        <button 
          onClick={() => { setActiveTab('history'); }} 
          className={`flex flex-col items-center p-1 font-bold transition-all ${activeTab === 'history' ? 'text-[#007AFF]' : 'text-slate-400'}`}
        >
          <History size={18} />
          <span className="text-[10px] mt-0.5">ইতিহাস ({historyList.length})</span>
        </button>
        <button 
          onClick={() => { setActiveTab('profile'); }} 
          className={`flex flex-col items-center p-1 font-bold transition-all ${activeTab === 'profile' ? 'text-[#007AFF]' : 'text-slate-400'}`}
        >
          <Settings size={18} />
          <span className="text-[10px] mt-0.5">সেটিংস</span>
        </button>
      </nav>
    </div>
  );
}
