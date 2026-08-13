// Иконки для меню действий (⋮), по Figma: ic:outline-mode-edit,
// material-symbols:file-copy-outline, mdi:comment-processing-outline,
// material-symbols:archive-in, material-symbols:delete-outline.
export function MoreIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4">
      <circle cx="10" cy="4" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function EditIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <path
        d="M13.6 3.4a1.6 1.6 0 0 1 2.3 0l.7.7a1.6 1.6 0 0 1 0 2.3L7.4 15.6l-3.5.9.9-3.5 8.8-8.8z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <rect x="7" y="7" width="9" height="9" rx="1.3" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M4.5 12.5h-1a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CommentIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <path
        d="M3 4.5A1.5 1.5 0 0 1 4.5 3h11A1.5 1.5 0 0 1 17 4.5v7A1.5 1.5 0 0 1 15.5 13H9l-3.5 3v-3h-1A1.5 1.5 0 0 1 3 11.5v-7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M6.5 7h7M6.5 9.5h4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ArchiveIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <rect x="3" y="8.5" width="14" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8.5l1.3-4.5h11.4L17 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 10.5v4m0 0l-2-2m2 2l2-2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function UnarchiveIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <rect x="3" y="8.5" width="14" height="8" rx="1.2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M3 8.5l1.3-4.5h11.4L17 8.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M10 14.5v-4m0 0l-2 2m2-2l2 2" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DeleteIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <path
        d="M4 6h12M8 6V4.5A1.5 1.5 0 0 1 9.5 3h1A1.5 1.5 0 0 1 12 4.5V6m-6.5 0l.6 10a1.5 1.5 0 0 0 1.5 1.4h3.8a1.5 1.5 0 0 0 1.5-1.4L14.5 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StatusChangeIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4 flex-none">
      <path d="M4 10a6 6 0 0 1 10-4.2M16 10a6 6 0 0 1-10 4.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <path d="M14 3v3h-3M6 17v-3h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'size-3' }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className={className}>
      <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-3.5 flex-none">
      <path d="M4 10.5l3.5 3.5L16 5.5" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
