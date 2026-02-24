import { Head, router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Loader2, Plus, Search } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import AdminLayout from '@/layouts/admin/layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Games', href: '#' },
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const CREATION_TYPES = [
    { value: 'generation', label: 'Generation (AI)' },
    { value: 'manual', label: 'Manual' },
] as const;

interface Game {
    id: number;
    date: string;
    formatted_date: string;
    type: string;
    answer: { name: string; year: number } | null;
    subjects: string[];
    url: string;
}

interface CelebrityOption {
    id: number;
    name: string;
    birth_year: number;
    photo_url: string | null;
}

interface GameDetail {
    id: number;
    date: string;
    formatted_date: string;
    type: string;
    url: string;
    answer: { id: number; name: string; year: number; photo_url: string | null } | null;
    subjects: { id: number; name: string; photo_url: string | null }[];
    plays_count: number;
    win_rate: number;
}

interface GamesPageProps {
    games: Game[];
    gameTypes: string[];
    generateUrl: string;
    storeManualUrl: string;
    gameShowUrlTemplate: string;
    gameUpdateUrlTemplate: string;
    celebritiesSearchUrl: string;
    celebritiesRelationshipsUrlTemplate: string;
}

function formatGameType(type: string): string {
    return type
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
}

export default function Games() {
    const {
        games,
        gameTypes,
        generateUrl,
        storeManualUrl,
        gameShowUrlTemplate,
        gameUpdateUrlTemplate,
        celebritiesSearchUrl,
        celebritiesRelationshipsUrlTemplate,
    } = usePage<GamesPageProps>().props;

    const typeOptions = useMemo(
        () => (gameTypes.length > 0 ? gameTypes : ['celebrity_sh*ggers']),
        [gameTypes]
    );

    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [calendarMonth, setCalendarMonth] = useState(() => {
        const d = new Date();
        return { year: d.getFullYear(), month: d.getMonth() };
    });
    const [deletingGameId, setDeletingGameId] = useState<number | null>(null);

    const [createOpen, setCreateOpen] = useState(false);
    const [createStep, setCreateStep] = useState<'initial' | 'manual-answer' | 'manual-subjects'>('initial');
    const [createForm, setCreateForm] = useState({
        date: '',
        type: typeOptions[0] ?? 'celebrity_sh*ggers',
        creationType: 'generation' as 'generation' | 'manual',
    });
    const [manualAnswerSearch, setManualAnswerSearch] = useState('');
    const [manualAnswerResults, setManualAnswerResults] = useState<CelebrityOption[]>([]);
    const [manualAnswer, setManualAnswer] = useState<CelebrityOption | null>(null);
    const [manualRelationships, setManualRelationships] = useState<CelebrityOption[]>([]);
    const [manualSubjectIds, setManualSubjectIds] = useState<number[]>([]);
    const [generateLoading, setGenerateLoading] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generatingDate, setGeneratingDate] = useState<string | null>(null);
    const [manualSubmitting, setManualSubmitting] = useState(false);

    const [editGameId, setEditGameId] = useState<number | null>(null);
    const [editGame, setEditGame] = useState<GameDetail | null>(null);
    const [editLoading, setEditLoading] = useState(false);
    const [editAnswerSearch, setEditAnswerSearch] = useState('');
    const [editAnswerResults, setEditAnswerResults] = useState<CelebrityOption[]>([]);
    const [editAnswer, setEditAnswer] = useState<CelebrityOption | null>(null);
    const [editRelationships, setEditRelationships] = useState<CelebrityOption[]>([]);
    const [editSubjectIds, setEditSubjectIds] = useState<number[]>([]);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const getTodayDateStr = useCallback(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }, []);

    const openCreateModal = useCallback(
        (prefillDate?: string) => {
            setCreateStep('initial');
            setCreateForm({
                date: prefillDate ?? getTodayDateStr(),
                type: typeOptions[0] ?? 'celebrity_sh*ggers',
                creationType: 'generation',
            });
            setManualAnswer(null);
            setManualAnswerSearch('');
            setManualAnswerResults([]);
            setManualRelationships([]);
            setManualSubjectIds([]);
            setGenerateError(null);
            setCreateOpen(true);
        },
        [typeOptions, getTodayDateStr]
    );

    const closeCreateModal = useCallback(() => {
        setCreateOpen(false);
        setGenerateLoading(false);
        setGenerateError(null);
        setManualSubmitting(false);
    }, []);

    const filteredGames = useMemo(() => {
        let list = games;
        if (typeFilter !== 'all') list = list.filter((g) => g.type === typeFilter);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(
                (g) =>
                    g.formatted_date.toLowerCase().includes(q) ||
                    g.answer?.name.toLowerCase().includes(q) ||
                    g.subjects.some((s) => s.toLowerCase().includes(q))
            );
        }
        return list;
    }, [games, searchQuery, typeFilter]);

    const gamesByDate = useMemo(() => {
        const map = new Map<string, Game>();
        filteredGames.forEach((g) => map.set(g.date, g));
        return map;
    }, [filteredGames]);

    // Clear generating spinner when the game appears in the list
    useEffect(() => {
        if (!generatingDate) return;
        if (games.some((g) => g.date === generatingDate)) {
            setGeneratingDate(null);
        }
    }, [games, generatingDate]);

    // Poll while a date is generating; stop after 5 min so we don't spin forever on job failure
    useEffect(() => {
        if (!generatingDate) return;
        const interval = setInterval(() => router.reload(), 4000);
        const timeout = setTimeout(() => setGeneratingDate(null), 5 * 60 * 1000);
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [generatingDate]);

    const calendarWeeks = useMemo(() => {
        const { year, month } = calendarMonth;
        const first = new Date(year, month, 1);
        const last = new Date(year, month + 1, 0);
        const startPad = first.getDay();
        const daysInMonth = last.getDate();
        const totalCells = startPad + daysInMonth;
        const numWeeks = Math.ceil(totalCells / 7);
        const weeks: (number | null)[][] = [];
        let day = 1;
        for (let w = 0; w < numWeeks; w++) {
            const row: (number | null)[] = [];
            for (let d = 0; d < 7; d++) {
                const cellIndex = w * 7 + d;
                if (cellIndex < startPad || day > daysInMonth) row.push(null);
                else {
                    row.push(day);
                    day++;
                }
            }
            weeks.push(row);
        }
        return weeks;
    }, [calendarMonth]);

    useEffect(() => {
        if (!createOpen || createStep !== 'manual-answer') return;
        const q = manualAnswerSearch.trim();
        if (!q) {
            setManualAnswerResults([]);
            return;
        }
        const t = setTimeout(async () => {
            const url = `${celebritiesSearchUrl}?q=${encodeURIComponent(q)}`;
            const res = await fetch(url);
            const data = (await res.json()) as CelebrityOption[];
            setManualAnswerResults(data);
        }, 300);
        return () => clearTimeout(t);
    }, [createOpen, createStep, manualAnswerSearch, celebritiesSearchUrl]);

    useEffect(() => {
        if (!createOpen || !manualAnswer) return;
        const url = celebritiesRelationshipsUrlTemplate.replace('__ID__', String(manualAnswer.id));
        fetch(url, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load relationships'))))
            .then((data: CelebrityOption[]) => setManualRelationships(data))
            .catch(() => setManualRelationships([]));
    }, [createOpen, manualAnswer, celebritiesRelationshipsUrlTemplate]);

    const prevMonth = () => {
        setCalendarMonth((prev) =>
            prev.month === 0 ? { year: prev.year - 1, month: 11 } : { year: prev.year, month: prev.month - 1 }
        );
    };
    const nextMonth = () => {
        setCalendarMonth((prev) =>
            prev.month === 11 ? { year: prev.year + 1, month: 0 } : { year: prev.year, month: prev.month + 1 }
        );
    };
    const monthLabel = useMemo(() => {
        const d = new Date(calendarMonth.year, calendarMonth.month, 1);
        return d.toLocaleString('default', { month: 'long', year: 'numeric' });
    }, [calendarMonth]);

    const handleDelete = (gameId: number) => {
        setDeletingGameId(gameId);
        router.delete(`/admin/games/${gameId}`, {
            preserveScroll: true,
            onFinish: () => setDeletingGameId(null),
        });
    };

    const openEditModal = useCallback(
        (gameId: number) => {
            setEditGameId(gameId);
            setEditGame(null);
            setEditError(null);
            setEditLoading(true);
            const url = gameShowUrlTemplate.replace('__ID__', String(gameId));
            fetch(url, { credentials: 'include' })
                .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Failed to load game'))))
                .then((data: GameDetail) => {
                    setEditGame(data);
                    setEditAnswer(
                        data.answer
                            ? {
                                  id: data.answer.id,
                                  name: data.answer.name,
                                  birth_year: data.answer.year,
                                  photo_url: data.answer.photo_url,
                              }
                            : null
                    );
                    setEditSubjectIds(data.subjects.map((s) => s.id));
                    setEditAnswerSearch('');
                    setEditAnswerResults([]);
                })
                .catch(() => setEditError('Failed to load game'))
                .finally(() => setEditLoading(false));
        },
        [gameShowUrlTemplate]
    );

    const closeEditModal = useCallback(() => {
        setEditGameId(null);
        setEditGame(null);
        setEditAnswer(null);
        setEditAnswerSearch('');
        setEditAnswerResults([]);
        setEditRelationships([]);
        setEditSubjectIds([]);
        setEditError(null);
    }, []);

    useEffect(() => {
        if (editGameId == null || !editAnswer) return;
        const url = celebritiesRelationshipsUrlTemplate.replace('__ID__', String(editAnswer.id));
        fetch(url, { credentials: 'include' })
            .then((r) => (r.ok ? r.json() : Promise.reject()))
            .then((data: CelebrityOption[]) => setEditRelationships(data))
            .catch(() => setEditRelationships([]));
    }, [editGameId, editAnswer?.id, celebritiesRelationshipsUrlTemplate]);

    useEffect(() => {
        if (editGameId == null || editAnswerSearch === '') {
            setEditAnswerResults([]);
            return;
        }
        const t = setTimeout(() => {
            const params = new URLSearchParams({ q: editAnswerSearch });
            fetch(`${celebritiesSearchUrl}?${params}`, { credentials: 'include' })
                .then((r) => (r.ok ? r.json() : Promise.reject()))
                .then((data: CelebrityOption[]) => setEditAnswerResults(data))
                .catch(() => setEditAnswerResults([]));
        }, 200);
        return () => clearTimeout(t);
    }, [editGameId, editAnswerSearch, celebritiesSearchUrl]);

    const toggleEditSubject = (id: number) => {
        setEditSubjectIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 4) return prev;
            return [...prev, id];
        });
    };

    const handleEditSave = () => {
        if (!editGame || !editAnswer || editSubjectIds.length !== 4) return;
        setEditSaving(true);
        setEditError(null);
        const url = gameUpdateUrlTemplate.replace('__ID__', String(editGame.id));
        fetch(url, {
            method: 'PATCH',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '', Accept: 'application/json' },
            body: JSON.stringify({ answer_id: editAnswer.id, subject_ids: editSubjectIds }),
        })
            .then((r) => {
                if (!r.ok) return r.json().then((d) => Promise.reject(new Error(d.message ?? 'Update failed')));
            })
            .then(() => {
                closeEditModal();
                router.reload();
            })
            .catch((err: Error) => {
                setEditError(err.message ?? 'Update failed');
            })
            .finally(() => setEditSaving(false));
    };

    const handleGenerateSubmit = async () => {
        if (!createForm.date) return;
        setGenerateLoading(true);
        setGenerateError(null);
        const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
        try {
            const res = await fetch(generateUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({ date: createForm.date, type: createForm.type }),
                credentials: 'include',
            });
            const data = (await res.json()) as { dispatched?: boolean; date?: string; message?: string };
            if (!res.ok) {
                setGenerateError(data.message ?? 'Generation failed.');
                return;
            }
            if (data.dispatched && data.date) {
                setGeneratingDate(data.date);
                closeCreateModal();
            }
        } catch {
            setGenerateError('Request failed.');
        } finally {
            setGenerateLoading(false);
        }
    };

    const handleManualAnswerNext = () => {
        if (manualAnswer) setCreateStep('manual-subjects');
    };

    const toggleManualSubject = (id: number) => {
        setManualSubjectIds((prev) => {
            if (prev.includes(id)) return prev.filter((x) => x !== id);
            if (prev.length >= 4) return prev;
            return [...prev, id];
        });
    };

    const handleManualSubmit = () => {
        if (manualSubjectIds.length !== 4 || !manualAnswer || !createForm.date) return;
        setManualSubmitting(true);
        router.post(storeManualUrl, {
            game_date: createForm.date,
            type: createForm.type,
            answer_id: manualAnswer.id,
            subject_ids: manualSubjectIds,
        }, {
            preserveScroll: true,
            onFinish: () => setManualSubmitting(false),
            onSuccess: () => closeCreateModal(),
            onError: () => setManualSubmitting(false),
        });
    };

    const dateStrForCell = (day: number) =>
        `${calendarMonth.year}-${String(calendarMonth.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Games">
                <meta name="robots" content="noindex, nofollow" />
            </Head>
            <AdminLayout title="Games" description="View and manage all games">
                <div className="space-y-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                type="text"
                                placeholder="Search games by date, answer, or subjects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-[180px] shrink-0">
                                <SelectValue placeholder="Game type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All types</SelectItem>
                                {gameTypes.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {formatGameType(t)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={() => openCreateModal()} className="max-w-48">
                            <Plus className="mr-2 h-4 w-4" />
                            Create game
                        </Button>
                    </div>

                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-slate-900 font-display">{monthLabel}</h2>
                            <div className="flex gap-1">
                                <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="icon" onClick={nextMonth} className="h-9 w-9">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-md overflow-hidden">
                            {WEEKDAY_LABELS.map((label) => (
                                <div
                                    key={label}
                                    className="bg-slate-50 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-600 font-body"
                                >
                                    {label}
                                </div>
                            ))}
                            {calendarWeeks.flatMap((week, wi) =>
                                week.map((day, i) => {
                                    if (day === null) {
                                        return (
                                            <div
                                                key={`e-${calendarMonth.year}-${calendarMonth.month}-${wi}-${i}`}
                                                className="min-h-[80px] bg-slate-50"
                                            />
                                        );
                                    }
                                    const dateStr = dateStrForCell(day);
                                    const game = gamesByDate.get(dateStr);
                                    const isGenerating = !game && dateStr === generatingDate;
                                    return (
                                        <div
                                            key={dateStr}
                                            className={`min-h-[80px] bg-white p-1.5 border-b border-slate-100 last:border-b-0 ${!game && !isGenerating ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                                            onClick={!game && !isGenerating ? () => openCreateModal(dateStr) : undefined}
                                            role={!game && !isGenerating ? 'button' : undefined}
                                        >
                                            <div className="text-right text-xs text-slate-500 font-body mb-1">
                                                {day}
                                            </div>
                                            {game ? (
                                                <div className="space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openEditModal(game.id);
                                                        }}
                                                        className="w-full block rounded border border-slate-200 bg-slate-50 p-2 text-left text-xs hover:border-coral hover:bg-coral/5 transition-colors"
                                                    >
                                                        <div className="font-medium text-slate-900 font-body truncate">
                                                            {game.answer?.name ?? '—'}
                                                        </div>
                                                        {game.subjects.length > 0 && (
                                                            <div className="text-slate-500 font-body truncate">
                                                                {game.subjects.slice(0, 2).join(', ')}
                                                                {game.subjects.length > 2 ? '…' : ''}
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : isGenerating ? (
                                                <div className="flex items-center justify-center h-10 text-coral">
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center h-10 text-slate-400 text-xs font-body">
                                                    + Add game
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {filteredGames.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-slate-500 font-body">
                                {searchQuery || typeFilter !== 'all'
                                    ? 'No games match your filters.'
                                    : 'No games found.'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Create game modal */}
                <Dialog open={createOpen} onOpenChange={(open) => !open && closeCreateModal()}>
                    <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
                        {createStep === 'initial' ? (
                            <>
                                <DialogTitle>Create game</DialogTitle>
                                <DialogDescription>Choose type, date, and how to create the game.</DialogDescription>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label>Game type</Label>
                                        <Select
                                            value={createForm.type}
                                            onValueChange={(v) => setCreateForm((f) => ({ ...f, type: v }))}
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {typeOptions.map((t) => (
                                                    <SelectItem key={t} value={t}>
                                                        {formatGameType(t)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label htmlFor="create-date">Date</Label>
                                        <Input
                                            id="create-date"
                                            type="date"
                                            value={createForm.date}
                                            onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))}
                                            className="mt-1"
                                        />
                                    </div>
                                    <div>
                                        <Label>Creation type</Label>
                                        <Select
                                            value={createForm.creationType}
                                            onValueChange={(v: 'generation' | 'manual') =>
                                                setCreateForm((f) => ({ ...f, creationType: v }))
                                            }
                                        >
                                            <SelectTrigger className="mt-1">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {CREATION_TYPES.map((opt) => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {generateError && (
                                        <p className="text-sm text-red-600 font-body">{generateError}</p>
                                    )}
                                </div>
                                <DialogFooter className="gap-2">
                                    <DialogClose asChild>
                                        <Button variant="secondary" size="sm">Cancel</Button>
                                    </DialogClose>
                                    {createForm.creationType === 'generation' ? (
                                        <Button
                                            size="sm"
                                            onClick={handleGenerateSubmit}
                                            disabled={!createForm.date || generateLoading}
                                        >
                                            {generateLoading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Dispatching…
                                                </>
                                            ) : (
                                                'Generate'
                                            )}
                                        </Button>
                                    ) : (
                                        <Button
                                            size="sm"
                                            onClick={() => setCreateStep('manual-answer')}
                                            disabled={!createForm.date}
                                        >
                                            Next
                                        </Button>
                                    )}
                                </DialogFooter>
                            </>
                        ) : createStep === 'manual-answer' ? (
                            <>
                                <DialogTitle>Select answer</DialogTitle>
                                <DialogDescription>Search and select the celebrity that will be the answer.</DialogDescription>
                                <div className="space-y-4 py-4">
                                    <div>
                                        <Label>Search celebrity</Label>
                                        <div className="relative mt-1">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <Input
                                                placeholder="Search by name..."
                                                value={manualAnswerSearch}
                                                onChange={(e) => setManualAnswerSearch(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    {manualAnswerSearch && (
                                        <ul className="max-h-48 overflow-y-auto rounded-md border border-slate-200 divide-y">
                                            {manualAnswerResults.map((c) => (
                                                <li key={c.id}>
                                                    <button
                                                        type="button"
                                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50 font-body"
                                                        onClick={() => {
                                                            setManualAnswer(c);
                                                            setManualAnswerSearch('');
                                                            setManualAnswerResults([]);
                                                        }}
                                                    >
                                                        {c.photo_url ? (
                                                            <img src={c.photo_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                                                        ) : (
                                                            <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                                {c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-slate-900">{c.name}</span>
                                                        <span className="text-slate-500">(b. {c.birth_year})</span>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                    {manualAnswer && (
                                        <p className="text-sm text-slate-600 font-body">
                                            Answer: <strong>{manualAnswer.name}</strong>
                                        </p>
                                    )}
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setCreateStep('initial')}>
                                        Back
                                    </Button>
                                    <Button size="sm" onClick={handleManualAnswerNext} disabled={!manualAnswer}>
                                        Next
                                    </Button>
                                </DialogFooter>
                            </>
                        ) : (
                            <>
                                <DialogTitle>Select 4 subjects</DialogTitle>
                                <DialogDescription>
                                    Choose 4 celebrities from {manualAnswer?.name}'s saved relationships.
                                </DialogDescription>
                                <div className="space-y-2 py-4 max-h-64 overflow-y-auto">
                                    {manualRelationships.length === 0 ? (
                                        <p className="text-sm text-slate-500 font-body">
                                            No saved relationships for this celebrity. Add relationships from the Celebrities admin first.
                                        </p>
                                    ) : (
                                        manualRelationships.map((c) => (
                                            <label
                                                key={c.id}
                                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer font-body"
                                            >
                                                <Checkbox
                                                    checked={manualSubjectIds.includes(c.id)}
                                                    onCheckedChange={() => toggleManualSubject(c.id)}
                                                    disabled={!manualSubjectIds.includes(c.id) && manualSubjectIds.length >= 4}
                                                />
                                                {c.photo_url ? (
                                                    <img src={c.photo_url} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" />
                                                ) : (
                                                    <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                                        {c.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                    </div>
                                                )}
                                                <span className="text-sm font-medium text-slate-900">{c.name}</span>
                                                <span className="text-slate-500 text-xs">(b. {c.birth_year})</span>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <DialogFooter className="gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => setCreateStep('manual-answer')}>
                                        Back
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleManualSubmit}
                                        disabled={manualSubjectIds.length !== 4 || manualSubmitting}
                                    >
                                        {manualSubmitting ? 'Creating...' : 'Create game'}
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Edit game modal */}
                <Dialog open={editGameId !== null} onOpenChange={(open) => !open && closeEditModal()}>
                    <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        {editLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="h-10 w-10 animate-spin text-coral" />
                                <p className="text-slate-600 font-body">Loading game…</p>
                            </div>
                        ) : editError && !editGame ? (
                            <div className="py-6 text-center">
                                <p className="text-red-600 font-body">{editError}</p>
                                <Button variant="secondary" size="sm" className="mt-4" onClick={closeEditModal}>
                                    Close
                                </Button>
                            </div>
                        ) : editGame ? (
                            <>
                                <DialogTitle>Edit game — {editGame.formatted_date}</DialogTitle>
                                <DialogDescription>
                                    Update the answer and subjects. Stats are for this game only.
                                </DialogDescription>
                                <div className="space-y-4 py-2">
                                    <div className="flex gap-4 text-sm text-slate-600 font-body">
                                        <span>
                                            <span className="font-semibold">{editGame.plays_count}</span> played
                                        </span>
                                        <span>
                                            <span className="font-semibold">{editGame.win_rate}%</span> win rate
                                        </span>
                                        <a
                                            href={editGame.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-coral hover:underline"
                                        >
                                            Play game →
                                        </a>
                                    </div>
                                    <div>
                                        <Label>Answer (celebrity)</Label>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            {editAnswer ? (
                                                <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                                                    {editAnswer.photo_url ? (
                                                        <img
                                                            src={editAnswer.photo_url}
                                                            alt=""
                                                            className="h-8 w-8 rounded-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="h-8 w-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                                            {editAnswer.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                                                        </div>
                                                    )}
                                                    <span className="font-body text-sm font-medium">{editAnswer.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditAnswer(null)}
                                                        className="text-slate-400 hover:text-slate-600 text-xs"
                                                    >
                                                        Change
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <Input
                                                        placeholder="Search celebrities…"
                                                        value={editAnswerSearch}
                                                        onChange={(e) => setEditAnswerSearch(e.target.value)}
                                                        className="max-w-[200px]"
                                                    />
                                                    {editAnswerResults.length > 0 && (
                                                        <ul className="mt-1 w-full max-h-40 overflow-y-auto rounded border border-slate-200 bg-white py-1">
                                                            {editAnswerResults.map((c) => (
                                                                <li key={c.id}>
                                                                    <button
                                                                        type="button"
                                                                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 font-body text-sm"
                                                                        onClick={() => {
                                                                            setEditAnswer(c);
                                                                            setEditAnswerSearch('');
                                                                            setEditAnswerResults([]);
                                                                            setEditSubjectIds([]);
                                                                        }}
                                                                    >
                                                                        {c.photo_url ? (
                                                                            <img src={c.photo_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                                                        ) : (
                                                                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                                                                                {c.name.slice(0, 2).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                        {c.name} (b. {c.birth_year})
                                                                    </button>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <Label>Subjects (choose 4 from {editAnswer?.name ?? 'answer'}&apos;s relationships)</Label>
                                        {!editAnswer ? (
                                            <p className="mt-1 text-sm text-slate-500 font-body">Select an answer first.</p>
                                        ) : editRelationships.length === 0 ? (
                                            <p className="mt-1 text-sm text-slate-500 font-body">No saved relationships. Add them in Celebrities admin.</p>
                                        ) : (
                                            <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                                                {editRelationships.map((c) => (
                                                    <label
                                                        key={c.id}
                                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer font-body text-sm"
                                                    >
                                                        <Checkbox
                                                            checked={editSubjectIds.includes(c.id)}
                                                            onCheckedChange={() => toggleEditSubject(c.id)}
                                                            disabled={!editSubjectIds.includes(c.id) && editSubjectIds.length >= 4}
                                                        />
                                                        {c.photo_url ? (
                                                            <img src={c.photo_url} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                                                        ) : (
                                                            <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs shrink-0">
                                                                {c.name.slice(0, 2).toUpperCase()}
                                                            </div>
                                                        )}
                                                        <span className="font-medium text-slate-900">{c.name}</span>
                                                        <span className="text-slate-500 text-xs">(b. {c.birth_year})</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                        {editAnswer && editSubjectIds.length !== 4 && (
                                            <p className="mt-1 text-xs text-amber-600 font-body">
                                                Select exactly 4 subjects ({editSubjectIds.length}/4).
                                            </p>
                                        )}
                                    </div>
                                    {editError && (
                                        <p className="text-sm text-red-600 font-body">{editError}</p>
                                    )}
                                </div>
                                <DialogFooter className="gap-2 flex-wrap">
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => {
                                            if (editGameId != null) {
                                                closeEditModal();
                                                handleDelete(editGameId);
                                            }
                                        }}
                                        disabled={deletingGameId === editGameId}
                                    >
                                        {deletingGameId === editGameId ? 'Deleting…' : 'Delete game'}
                                    </Button>
                                    <div className="flex gap-2 ml-auto">
                                        <Button variant="secondary" size="sm" onClick={closeEditModal}>
                                            Cancel
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={handleEditSave}
                                            disabled={!editAnswer || editSubjectIds.length !== 4 || editSaving}
                                        >
                                            {editSaving ? 'Saving…' : 'Save'}
                                        </Button>
                                    </div>
                                </DialogFooter>
                            </>
                        ) : null}
                    </DialogContent>
                </Dialog>
            </AdminLayout>
        </AppLayout>
    );
}
