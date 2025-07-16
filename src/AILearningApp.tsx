import React, { useState, useEffect, ChangeEvent } from 'react';
import { Bot, Brain, BookOpen, BarChart3, Upload, RotateCcw, Star, Trophy, Heart } from 'lucide-react';

// ===== TypeScriptのための「型」定義 =====
interface LearningItem {
  id: number;
  question: string;
  answer: string;
  image: string | null;
  timestamp: string;
  type: 'image' | 'text';
}

interface TestResult {
  id: number;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  correct: boolean;
  timestamp: string;
  type?: 'free';
}

interface AIAppearance {
    emoji: string;
    name: string;
    color: string;
}

// ===== アプリ本体のコンポーネント =====
const AILearningApp: React.FC = () => {
    // --- 状態管理 (useState) ---
    const [aiName, setAiName] = useState<string>('');
    const [mode, setMode] = useState<string>('learning');
    const [exp, setExp] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [learningData, setLearningData] = useState<LearningItem[]>([]);
    const [testResults, setTestResults] = useState<TestResult[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<string>('');
    const [currentAnswer, setCurrentAnswer] = useState<string>('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [showNaming, setShowNaming] = useState<boolean>(true);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [freeTextQuestion, setFreeTextQuestion] = useState<string>('');
    const [freeTextAnswer, setFreeTextAnswer] = useState<string>('');

    // --- 定数とヘルパー関数 ---
    const expRequiredForLevel = (lv: number): number => lv * 100;
    const maxLevel = 5;

    const getAIAppearance = (): AIAppearance => {
        const appearances: { [key: number]: AIAppearance } = {
            1: { emoji: '🥚', name: 'たまご', color: 'bg-yellow-100 text-yellow-800' },
            2: { emoji: '🐣', name: 'ひよこ', color: 'bg-yellow-200 text-yellow-900' },
            3: { emoji: '🐤', name: 'こども', color: 'bg-blue-100 text-blue-800' },
            4: { emoji: '🦜', name: 'せいねん', color: 'bg-green-100 text-green-800' },
            5: { emoji: '🦅', name: 'けんじゃ', color: 'bg-purple-100 text-purple-800' },
        };
        return appearances[level] || appearances[1];
    };

    const getAIMessage = (): string => {
        const messages: { [key: number]: string[] } = {
            1: ['はじめまして！何も知らないので教えてください', 'まだ何もわからないけど、がんばります！'],
            2: ['少しずつ覚えてきました！', 'もっと教えてください♪'],
            3: ['だいぶ理解できるようになりました', '新しいことを学ぶのが楽しいです！'],
            4: ['かなり成長しました！', '複雑なことも理解できるようになりました'],
            5: ['私はもう立派なAIです！', 'あなたのおかげで賢くなりました、ありがとう！']
        };
        const levelMessages = messages[level] || messages[1];
        return levelMessages[Math.floor(Math.random() * levelMessages.length)];
    };

    // --- 副作用の管理 (useEffect) ---
    // ローカルストレージからのデータ読み込み（初回のみ）
    useEffect(() => {
        const savedName = localStorage.getItem('aiName');
        if (savedName) {
            setAiName(savedName);
            setShowNaming(false);
        }
        const savedData = localStorage.getItem('learningData');
        if (savedData) setLearningData(JSON.parse(savedData));
        const savedResults = localStorage.getItem('testResults');
        if (savedResults) setTestResults(JSON.parse(savedResults));
        const savedLevel = localStorage.getItem('aiLevel');
        if (savedLevel) setLevel(JSON.parse(savedLevel));
        const savedExp = localStorage.getItem('aiExp');
        if (savedExp) setExp(JSON.parse(savedExp));
    }, []);

    // データが変更されるたびにローカルストレージに保存
    useEffect(() => {
        if (!showNaming) { // 命名画面表示中は保存しない
            localStorage.setItem('aiName', aiName);
            localStorage.setItem('learningData', JSON.stringify(learningData));
            localStorage.setItem('testResults', JSON.stringify(testResults));
            localStorage.setItem('aiLevel', JSON.stringify(level));
            localStorage.setItem('aiExp', JSON.stringify(exp));
        }
    }, [aiName, learningData, testResults, level, exp, showNaming]);

    // レベルアップ判定
    useEffect(() => {
        const required = expRequiredForLevel(level);
        if (exp >= required && level < maxLevel) {
            setLevel(level + 1);
            setExp(exp - required);
        }
    }, [exp, level]);

    // --- イベントハンドラ ---
    const handleLearning = () => {
        if (!currentQuestion.trim() || !currentAnswer.trim()) return;
        const newLearningItem: LearningItem = {
            id: Date.now(),
            question: currentQuestion,
            answer: currentAnswer,
            image: imagePreview,
            timestamp: new Date().toLocaleString(),
            type: imagePreview ? 'image' : 'text'
        };
        setLearningData([...learningData, newLearningItem]);
        setExp(exp + 10);
        setCurrentQuestion('');
        setCurrentAnswer('');
        setImagePreview(null);
        setSelectedFile(null);
    };

    const handleTest = () => {
        if (learningData.length === 0) {
            alert("まだ学習データがありません！");
            return;
        }
        const randomItem = learningData[Math.floor(Math.random() * learningData.length)];
        setCurrentQuestion(randomItem.question);
        setCurrentAnswer('');
        setIsCorrect(null);
    };

    const checkAnswer = () => {
        if (!currentAnswer.trim()) return;
        const correctAnswerItem = learningData.find(item => item.question === currentQuestion);
        if (!correctAnswerItem) return;

        const correct = currentAnswer.toLowerCase().trim() === correctAnswerItem.answer.toLowerCase().trim();
        setIsCorrect(correct);
        
        const testResult: TestResult = {
            id: Date.now(),
            question: currentQuestion,
            userAnswer: currentAnswer,
            correctAnswer: correctAnswerItem.answer,
            correct: correct,
            timestamp: new Date().toLocaleString()
        };
        setTestResults([...testResults, testResult]);
        
        if (correct) {
            setExp(exp + 15);
        }
    };

    const handleFreeTest = () => {
        if (!freeTextQuestion.trim() || !freeTextAnswer.trim()) return;
        const testResult: TestResult = {
            id: Date.now(),
            question: freeTextQuestion,
            userAnswer: freeTextAnswer,
            correctAnswer: '自由記述',
            correct: true,
            timestamp: new Date().toLocaleString(),
            type: 'free'
        };
        setTestResults([...testResults, testResult]);
        setExp(exp + 5);
        setFreeTextQuestion('');
        setFreeTextAnswer('');
    };

    const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setImagePreview(e.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleReset = () => {
        if (confirm('全てのデータをリセットしますか？この操作は取り消せません。')) {
            localStorage.clear();
            setAiName('');
            setExp(0);
            setLevel(1);
            setLearningData([]);
            setTestResults([]);
            setCurrentQuestion('');
            setCurrentAnswer('');
            setIsCorrect(null);
            setShowNaming(true);
            setSelectedFile(null);
            setImagePreview(null);
            setFreeTextQuestion('');
            setFreeTextAnswer('');
        }
    };

    const getAnalytics = () => {
        const totalTests = testResults.length;
        const correctTests = testResults.filter(r => r.correct).length;
        const accuracy = totalTests > 0 ? (correctTests / totalTests * 100).toFixed(1) : 0;
        const totalLearningItems = learningData.length;
        const imageItems = learningData.filter(item => item.type === 'image').length;
        const textItems = learningData.filter(item => item.type === 'text').length;
        return { totalTests, correctTests, accuracy, totalLearningItems, imageItems, textItems };
    };

    // --- JSXによるUIの描画 ---
    if (showNaming) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
                    <div className="text-center mb-8">
                        <div className="text-6xl mb-4">🥚</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">AIの赤ちゃんが生まれました！</h1>
                        <p className="text-gray-600">あなたの手でAIを育ててみてください。まず、AIに名前をつけてあげましょう。</p>
                    </div>
                    <div className="space-y-4">
                        <input
                            type="text"
                            value={aiName}
                            onChange={(e) => setAiName(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="例: アイちゃん"
                        />
                        <button
                            onClick={() => aiName.trim() && setShowNaming(false)}
                            disabled={!aiName.trim()}
                            className="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
                        >
                            育成を開始する
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const appearance = getAIAppearance();
    const analytics = getAnalytics();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 lg:p-8">
            <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b rounded-2xl p-4 sticky top-4 z-10">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center space-x-4">
                            <div className={`${appearance.color} rounded-full p-3`}>
                                <span className="text-2xl">{appearance.emoji}</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-800">{aiName}</h1>
                                <p className="text-sm text-gray-600">{appearance.name} (Lv.{level})</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Star className="w-5 h-5 text-yellow-500" />
                                <span className="font-medium">{exp}/{expRequiredForLevel(level)}</span>
                            </div>
                            <button onClick={handleReset} className="flex items-center space-x-1 text-red-600 hover:text-red-700 transition-colors">
                                <RotateCcw className="w-4 h-4" /><span>リセット</span>
                            </button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="bg-gray-200 rounded-full h-2">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300" style={{ width: `${(exp / expRequiredForLevel(level)) * 100}%` }}/>
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-6xl mx-auto py-8">
                <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm p-6 mb-8">
                    <div className="flex items-center space-x-4">
                        <span className="text-3xl">{appearance.emoji}</span>
                        <div className="bg-gray-100 rounded-2xl px-4 py-3 flex-1">
                            <p className="text-gray-800">{getAIMessage()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex space-x-2 sm:space-x-4 mb-8">
                    <button onClick={() => setMode('learning')} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${mode === 'learning' ? 'bg-blue-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><BookOpen className="w-5 h-5" /><span>学習</span></button>
                    <button onClick={() => setMode('test')} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${mode === 'test' ? 'bg-green-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><Brain className="w-5 h-5" /><span>テスト</span></button>
                    <button onClick={() => setMode('analysis')} className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl transition-all ${mode === 'analysis' ? 'bg-purple-500 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-gray-50'}`}><BarChart3 className="w-5 h-5" /><span>分析</span></button>
                </div>

                {/* 各モードのパネル */}
                {mode === 'learning' && (
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">📚 学習モード</h2>
                        <div className="space-y-4">
                            {/* ...学習フォーム... */}
                        </div>
                        {learningData.length > 0 && (
                            <div className="mt-8">
                                {/* ...学習済みデータ一覧... */}
                            </div>
                        )}
                    </div>
                )}
                {/* ... 他のモードのパネルも同様に ... */}
            </div>
        </div>
    );
};

export default AILearningApp;