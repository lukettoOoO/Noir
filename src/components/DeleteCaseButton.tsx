"use client";

import { Trash2 } from "lucide-react";
import { deleteCase } from "../app/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteCaseButton({ caseId }: { caseId: string }) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this case file? This action cannot be undone.")) return;

        setIsDeleting(true);
        try {
            const result = await deleteCase(caseId);
            if (result.success) {
                router.refresh();
            } else {
                alert("Failed to delete case.");
            }
        } catch (error) {
            console.error("Error deleting case:", error);
            alert("An error occurred.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-neutral-600 hover:text-red-500 transition-colors p-2"
            title="Delete Case"
        >
            <Trash2 className={`w-4 h-4 ${isDeleting ? 'animate-pulse' : ''}`} />
        </button>
    );
}
