import { getMyCases } from "../actions";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

export default async function Dashboard() {
    const cases = await getMyCases();

    return (
        <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8 font-mono">
            <header className="flex justify-between items-center mb-8 border-b border-neutral-700 pb-4">
                <h1 className="text-3xl font-bold tracking-tighter">CASE FILES</h1>
                <UserButton />
            </header>

            <main>
                {cases.length === 0 ? (
                    <div className="text-center py-12 text-neutral-500">
                        <p>No active investigations found.</p>
                        <Link href="/" className="mt-4 inline-block bg-neutral-100 text-neutral-900 px-4 py-2 font-bold hover:bg-neutral-300 transition-colors">
                            START NEW CASE
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {cases.map((c) => (
                            <div key={c.id} className="border border-neutral-700 p-4 hover:border-neutral-500 transition-colors">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-xl font-bold mb-1">Case #{c.id.slice(-4)}</h2>
                                        <p className="text-sm text-neutral-400">Status: {c.status.toUpperCase()}</p>
                                        <p className="text-xs text-neutral-500 mt-2">Last Update: {c.updatedAt.toLocaleString()}</p>
                                    </div>
                                    {/* Linking to /case/[id] as requested, though we need to implement that route or handle it in page.tsx */}
                                    <Link href={`/case/${c.id}`} className="bg-neutral-800 px-3 py-1 text-sm hover:bg-neutral-700">
                                        OPEN FILE
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
