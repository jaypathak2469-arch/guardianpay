"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2, Users } from "lucide-react";
import { t } from "@/lib/i18n";
import { uid } from "@/lib/mock-data";
import type { GuardianContact, Language, NotifyPreference } from "@/lib/types";
import { Button } from "./ui/button";

const empty: Omit<GuardianContact, "id"> = {
  name: "",
  relation: "",
  phone: "",
  email: "",
  notifyBy: "sms",
};

export function GuardianCircleManager({
  guardians,
  language,
  seniorMode,
  onChange,
}: {
  guardians: GuardianContact[];
  language: Language;
  seniorMode: boolean;
  onChange: (next: GuardianContact[]) => void;
}) {
  const [editing, setEditing] = useState<GuardianContact | (Omit<GuardianContact, "id"> & { id?: string }) | null>(null);

  const save = () => {
    if (!editing || !editing.name.trim()) return;
    if (editing.id) {
      onChange(guardians.map((g) => (g.id === editing.id ? (editing as GuardianContact) : g)));
    } else {
      onChange([...guardians, { ...(editing as Omit<GuardianContact, "id">), id: uid("g") }]);
    }
    setEditing(null);
  };

  const remove = (id: string) => {
    if (guardians.length <= 1) return;
    onChange(guardians.filter((g) => g.id !== id));
  };

  const field = `mt-1 w-full rounded-xl border-2 border-slate-400 px-3 ${seniorMode ? "min-h-16 text-lg" : "min-h-11"}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className={`flex items-center gap-2 font-bold ${seniorMode ? "text-2xl" : "text-xl"}`}>
          <Users className="h-6 w-6 text-[var(--gp-accent)]" />
          Trusted circle
        </h2>
        <Button senior={seniorMode} onClick={() => setEditing({ ...empty })}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      <ul className="space-y-3">
        {guardians.map((g) => (
          <li key={g.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-[var(--gp-ink)]">{g.name}</p>
                <p className="text-sm font-medium text-slate-800">
                  {g.relation} · {g.phone} · {g.email}
                </p>
                <p className="text-sm text-slate-800">Notify via {g.notifyBy}</p>
              </div>
              <div className="flex gap-2">
                <Button senior={seniorMode} variant="secondary" onClick={() => setEditing(g)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <span title={guardians.length <= 1 ? t("lastGuardian", language) : "Remove"}>
                  <Button
                    senior={seniorMode}
                    variant="ghost"
                    disabled={guardians.length <= 1}
                    onClick={() => remove(g.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </span>
              </div>
            </div>
            {guardians.length <= 1 ? (
              <p className="mt-2 text-sm font-medium text-slate-900">{t("lastGuardian", language)}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {editing ? (
        <div className="rounded-xl border-2 border-slate-400 bg-slate-50 p-4">
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold">
              Name
              <input className={field} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Relation
              <input className={field} value={editing.relation} onChange={(e) => setEditing({ ...editing, relation: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Phone
              <input className={field} value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Email
              <input className={field} value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Notify by
              <select
                className={field}
                value={editing.notifyBy}
                onChange={(e) => setEditing({ ...editing, notifyBy: e.target.value as NotifyPreference })}
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">Both</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex gap-2">
            <Button senior={seniorMode} onClick={save}>
              Save
            </Button>
            <Button senior={seniorMode} variant="secondary" onClick={() => setEditing(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
