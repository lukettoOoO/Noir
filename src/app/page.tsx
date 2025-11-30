import { getMyCases } from "./actions";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import DeleteCaseButton from "@/components/DeleteCaseButton";
import { FolderOpen } from "lucide-react";

export default async function Dashboard() {
    const cases = await getMyCases();

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 font-mono selection:bg-zinc-800">
            <header className="flex justify-between items-center mb-12 border-b border-zinc-800 pb-6">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <h1 className="text-5xl font-black tracking-tighter text-zinc-100" style={{ fontFamily: 'var(--font-special-elite)' }}>
                            NOIR
                        </h1>
                        <span className="text-[10px] tracking-[0.5em] text-zinc-500 uppercase">Detective Division</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <UserButton appearance={{
                        elements: {
                            avatarBox: "w-10 h-10 border-2 border-zinc-700"
                        }
                    }} />
                </div>
            </header>

            <main className="max-w-5xl mx-auto">
                <div className="flex justify-between items-end mb-6">
                    <h2 className="text-xl font-bold tracking-widest text-zinc-400 flex items-center gap-2">
                        <FolderOpen className="w-5 h-5" /> CASE ARCHIVES
                    </h2>
                    <Link href="/game" className="bg-zinc-100 text-zinc-950 px-6 py-2 font-bold hover:bg-zinc-300 transition-colors text-sm tracking-widest uppercase">
                        + New Investigation
                    </Link>
                </div>

                {cases.length === 0 ? (
                    <div className="border border-zinc-800 bg-zinc-900/50 p-12 text-center">
                        <p className="text-zinc-500 mb-4">No active investigations found in the archives.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {cases.map((c) => (
                            <div key={c.id} className="group border border-zinc-800 bg-zinc-900/30 p-6 hover:border-zinc-600 transition-all hover:bg-zinc-900/80 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-zinc-800 group-hover:bg-amber-600 transition-colors" />

                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 border ${c.status === 'solved' ? 'border-green-900 text-green-500 bg-green-900/10' : 'border-amber-900 text-amber-500 bg-amber-900/10'} uppercase tracking-wider`}>
                                                {c.status}
                                            </span>
                                            <span className="text-xs text-zinc-600 font-mono">#{c.id.slice(-8).toUpperCase()}</span>
                                        </div>

                                        <h3 className="text-xl font-bold text-zinc-200 mb-2 truncate font-serif tracking-wide">
                                            {c.title || "Untitled Investigation"}
                                        </h3>

                                        <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono">
                                            <span>UPDATED: {c.updatedAt.toLocaleDateString()} {c.updatedAt.toLocaleTimeString()}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Link href={`/game?caseId=${c.id}`} className="text-xs font-bold text-zinc-400 hover:text-zinc-100 border border-zinc-700 hover:border-zinc-500 px-4 py-2 uppercase tracking-wider transition-all">
                                            Open File
                                        </Link>
                                        <DeleteCaseButton caseId={c.id} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
