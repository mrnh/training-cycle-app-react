/** Speech bubble for comments: outline when there is none, filled when one is saved. */
export default function CommentIcon({ filled = false, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 5h16v11H9l-5 4z" />
    </svg>
  )
}
