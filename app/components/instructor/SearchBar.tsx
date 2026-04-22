type SearchBarProps = {
  onSearch: (query: string) => void;
};

export default function SearchBar({ onSearch }: SearchBarProps) {
  return (
    <div className="w-full">
      <input
        type="text"
        placeholder="Search by name or email..."
        onChange={(event) => onSearch(event.target.value)}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}
