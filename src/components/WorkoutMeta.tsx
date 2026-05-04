import { useWorkoutStore } from '../store/workoutStore';

export default function WorkoutMeta() {
  const { meta, setMeta } = useWorkoutStore();

  return (
    <div className="flex flex-wrap gap-3 items-end px-4 py-3 bg-gray-900 border-b border-gray-700">
      <div className="flex flex-col gap-1 min-w-[180px] flex-1">
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Workout Name</label>
        <input
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
          value={meta.name}
          onChange={(e) => setMeta({ name: e.target.value })}
          placeholder="My Workout"
        />
      </div>
      <div className="flex flex-col gap-1 min-w-[140px]">
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Author</label>
        <input
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
          value={meta.author}
          onChange={(e) => setMeta({ author: e.target.value })}
          placeholder="Your name"
        />
      </div>
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Description</label>
        <input
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
          value={meta.description}
          onChange={(e) => setMeta({ description: e.target.value })}
          placeholder="Workout description"
        />
      </div>
      <div className="flex flex-col gap-1 w-24">
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">FTP (W)</label>
        <input
          type="number"
          min={50}
          max={600}
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
          value={meta.ftp}
          onChange={(e) => setMeta({ ftp: Math.max(50, parseInt(e.target.value) || 200) })}
        />
      </div>
      <div className="flex flex-col gap-1 w-24">
        <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Sport</label>
        <select
          className="bg-gray-800 text-white rounded px-2 py-1 text-sm border border-gray-600 focus:outline-none focus:border-orange-500"
          value={meta.sportType}
          onChange={(e) => setMeta({ sportType: e.target.value as 'bike' | 'run' })}
        >
          <option value="bike">Bike</option>
          <option value="run">Run</option>
        </select>
      </div>
    </div>
  );
}
