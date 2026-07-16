import { useState } from "react";
import type { Category } from "../types";
import { CATEGORY_PALETTE } from "../lib/constants";
import { useI18n } from "../lib/i18n/I18nContext";
import { displayCategoryName } from "../lib/i18n/categoryName";
import styles from "./CategoryManager.module.css";

interface Props {
  categories: Category[];
  /** The catch-all category deleted entries fall back to; can't itself be deleted. */
  protectedId: string;
  onAdd: (data: Omit<Category, "id">) => void;
  onUpdate: (id: string, data: Partial<Omit<Category, "id">>) => void;
  onDelete: (id: string) => void;
}

export function CategoryManager({
  categories,
  protectedId,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const { t, lang } = useI18n();
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
              aria-label={t("catMgr.colorAria", { name: displayCategoryName(c, lang) })}
              onChange={(e) => onUpdate(c.id, { color: e.target.value })}
            />
            <input
              className={`input ${styles.icon}`}
              type="text"
              value={c.icon ?? ""}
              maxLength={2}
              aria-label={t("catMgr.iconAria", { name: displayCategoryName(c, lang) })}
              onChange={(e) =>
                onUpdate(c.id, { icon: e.target.value || undefined })
              }
            />
            <input
              className={`input ${styles.name}`}
              type="text"
              value={c.name}
              aria-label={t("catMgr.nameAria")}
              onChange={(e) => onUpdate(c.id, { name: e.target.value })}
            />
            <button
              className="btn btn-ghost btn-icon btn-danger"
              aria-label={t("catMgr.deleteAria", { name: displayCategoryName(c, lang) })}
              disabled={c.id === protectedId}
              title={
                c.id === protectedId
                  ? t("catMgr.protectedTitle")
                  : t("catMgr.deleteTitle")
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
          placeholder={t("catMgr.newIconPlaceholder")}
          maxLength={2}
          value={icon}
          aria-label={t("catMgr.newIconAria")}
          onChange={(e) => setIcon(e.target.value)}
        />
        <input
          className="input"
          type="text"
          placeholder={t("catMgr.newNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" className="btn btn-primary">
          {t("common.add")}
        </button>
      </form>
    </div>
  );
}
