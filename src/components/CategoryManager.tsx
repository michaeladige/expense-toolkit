import { useState } from "react";
import type { Category } from "../types";
import { CATEGORY_PALETTE } from "../lib/constants";
import styles from "./CategoryManager.module.css";

interface Props {
  categories: Category[];
  onAdd: (data: Omit<Category, "id">) => void;
  onUpdate: (id: string, data: Partial<Omit<Category, "id">>) => void;
  onDelete: (id: string) => void;
}

export function CategoryManager({
  categories,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");

  function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const color = CATEGORY_PALETTE[categories.length % CATEGORY_PALETTE.length];
    onAdd({ name: trimmed, icon: icon.trim() || undefined, color });
    setName("");
    setIcon("");
  }

  return (
    <div className={styles.wrap}>
      <ul className={styles.list}>
        {categories.map((c) => (
          <li key={c.id} className={styles.row}>
            <input
              className={styles.color}
              type="color"
              value={c.color}
              aria-label={`${c.name} color`}
              onChange={(e) => onUpdate(c.id, { color: e.target.value })}
            />
            <input
              className={`input ${styles.icon}`}
              type="text"
              value={c.icon ?? ""}
              maxLength={2}
              aria-label={`${c.name} icon`}
              onChange={(e) =>
                onUpdate(c.id, { icon: e.target.value || undefined })
              }
            />
            <input
              className={`input ${styles.name}`}
              type="text"
              value={c.name}
              aria-label="Category name"
              onChange={(e) => onUpdate(c.id, { name: e.target.value })}
            />
            <button
              className="btn btn-ghost btn-icon btn-danger"
              aria-label={`Delete ${c.name}`}
              disabled={c.id === "other"}
              title={
                c.id === "other"
                  ? "The default fallback category can't be deleted"
                  : "Delete category"
              }
              onClick={() => onDelete(c.id)}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <form className={styles.add} onSubmit={add}>
        <input
          className={`input ${styles.icon}`}
          type="text"
          placeholder="🙂"
          maxLength={2}
          value={icon}
          aria-label="New category icon"
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          className="input"
          type="text"
          placeholder="New category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>
    </div>
  );
}
