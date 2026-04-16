import { useEffect, useState } from "react";
import { supabase } from "./supabase";

type Task = {
  id: string; // Binago natin mula number pa-string dahil UUID na ang gamit natin sa database
  text: string;
  done: boolean;
};

type Filter = "all" | "active" | "done";

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dark, setDark] = useState(true);

  // Load Settings & Fetch initial data
  useEffect(() => {
    const darkMode = localStorage.getItem("dark");
    if (darkMode) setDark(JSON.parse(darkMode));

    fetchTasks();
  }, []);

  // Save Theme specifically
  useEffect(() => {
    localStorage.setItem("dark", JSON.stringify(dark));
  }, [dark]);

  // SUPABASE: Fetch Tasks
  const fetchTasks = async () => {
    // Dahil sa RLS public access na ginawa natin kanina, makukuha niya agad ito.
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching tasks:", error);
    } else if (data) {
      setTasks(data);
    }
  };

  // SUPABASE: Add / Update Task
  const addTask = async () => {
    if (!input.trim()) return;

    if (editId !== null) {
      // Update sa database
      const { error } = await supabase
        .from('tasks')
        .update({ text: input })
        .eq('id', editId);

      if (!error) {
        setTasks(tasks.map(t => (t.id === editId ? { ...t, text: input } : t)));
      } else {
        console.error("Error updating task:", error);
      }
      setEditId(null);
    } else {
      // Insert sa database
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ text: input, done: false }])
        .select()
        .single(); // Kunin yung bago mong dinagdag na may generated na ID!

      if (!error && data) {
        setTasks([data, ...tasks]); // Idagdag sa screen sa pinakataas
      } else {
        console.error("Error inserting task:", error);
      }
    }
    setInput("");
  };

  // SUPABASE: Toggle Done Status
  const toggleTask = async (task: Task) => {
    const newStatus = !task.done;

    // Optimistic UI Update (gagawin muna sa screen tapos update sa background)
    setTasks(tasks.map(t => (t.id === task.id ? { ...t, done: newStatus } : t)));

    // Background DB Update
    const { error } = await supabase
      .from('tasks')
      .update({ done: newStatus })
      .eq('id', task.id);

    if (error) {
      console.error("Error toggling task:", error);
      // Revert kung nagka-error man sa internet
      setTasks(tasks.map(t => (t.id === task.id ? { ...t, done: task.done } : t)));
    }
  };

  // SUPABASE: Delete Task
  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Tanggalin muna agad sa screen
    setTasks(tasks.filter(t => t.id !== id));

    // Burahin sa DB
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error("Error deleting task:", error);
  };

  const editTask = (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setInput(task.text);
    setEditId(task.id);
  };

  // SUPABASE: Clear Completed Tasks
  const clearCompleted = async () => {
    const completedIds = tasks.filter(t => t.done).map(t => t.id);

    setTasks(tasks.filter(t => !t.done));

    if (completedIds.length > 0) {
      const { error } = await supabase.from('tasks').delete().in('id', completedIds);
      if (error) console.error("Error clearing tasks:", error);
    }
  };

  // SUPABASE: Delete All Tasks
  const deleteAll = async () => {
    const allIds = tasks.map(t => t.id);
    setTasks([]);

    if (allIds.length > 0) {
      const { error } = await supabase.from('tasks').delete().in('id', allIds);
      if (error) console.error("Error deleting all tasks:", error);
    }
  };

  const filteredTasks = tasks
    .filter(t => {
      if (filter === "active") return !t.done;
      if (filter === "done") return t.done;
      return true;
    })
    .filter(t => t.text.toLowerCase().includes(search.toLowerCase()));

  const activeCount = tasks.filter(t => !t.done).length;

  return (
    // We use absolute inset-0 to overlay the app over the `#root` restricted constraints in index.css
    <div className={`fixed inset-0 overflow-y-auto font-sans tracking-wide transition-colors duration-700 m-0 p-0 text-left ${dark ? "bg-[#09090b] text-white" : "bg-neutral-50 text-neutral-900"}`}>

      {/* Dynamic Background Blurs */}
      <div className={`fixed -top-32 -left-32 w-96 h-96 rounded-full mix-blend-multiply opacity-50 blur-[128px] pointer-events-none transition-colors duration-700 ${dark ? "bg-violet-900" : "bg-violet-300"}`}></div>
      <div className={`fixed bottom-0 -right-32 w-96 h-96 rounded-full mix-blend-multiply opacity-50 blur-[128px] pointer-events-none transition-colors duration-700 ${dark ? "bg-blue-900" : "bg-blue-300"} animate-pulse`} style={{ animationDuration: '4s' }}></div>

      <div className="relative z-10 w-full max-w-2xl px-5 sm:px-8 py-10 my-6 sm:my-16 mx-auto sm:rounded-[2.5rem] transition-all duration-500 border
        backdrop-blur-3xl shadow-2xl
        dark:bg-zinc-950/40 dark:border-white/5 dark:shadow-[0_0_80px_rgba(0,0,0,0.8)]
        bg-white/60 border-black/5 shadow-neutral-300/50"
        style={{
          backgroundColor: dark ? "rgba(24, 24, 27, 0.4)" : "rgba(255, 255, 255, 0.6)",
          borderColor: dark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)"
        }}
      >

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-4">
            <div className={`p-3.5 rounded-2xl bg-gradient-to-br shadow-lg flex items-center justify-center transition-all ${dark ? "from-violet-500 to-indigo-600 shadow-indigo-500/20" : "from-violet-400 to-indigo-500 shadow-indigo-500/30"}`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-indigo-500 py-1">
                Tasks
              </h1>
              <p className={`text-sm font-medium ${dark ? "text-zinc-400" : "text-neutral-500"}`}>
                {activeCount} {activeCount === 1 ? 'task' : 'tasks'} remaining
              </p>
            </div>
          </div>

          <button
            onClick={() => setDark(!dark)}
            className={`p-3 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 ${dark ? "bg-zinc-800/80 hover:bg-zinc-700 text-yellow-400 focus:ring-offset-zinc-900 border border-white/5" : "bg-white/90 hover:bg-neutral-50 text-indigo-600 focus:ring-offset-neutral-50 shadow-sm border border-black/5"}`}
            aria-label="Toggle Dark Mode"
          >
            {dark ? (
              <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.32a1 1 0 011.415 0l.708.707a1 1 0 01-1.414 1.415l-.708-.708a1 1 0 010-1.414zm-8.44 0a1 1 0 010 1.414l-.708.708a1 1 0 11-1.414-1.415l.708-.707a1 1 0 011.415 0zM17 10a1 1 0 110 2h-1a1 1 0 110-2h1zM4 10a1 1 0 110 2H3a1 1 0 110-2h1zm11.78 4.68a1 1 0 010 1.415l-.707.708a1 1 0 01-1.415-1.414l.707-.708a1 1 0 011.415 0zM5.636 14.68a1 1 0 011.415 0l.707.708a1 1 0 01-1.414 1.414l-.708-.707a1 1 0 010-1.415zM10 16a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM10 6a4 4 0 100 8 4 4 0 000-8z" /></svg>
            ) : (
              <svg fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
            )}
          </button>
        </div>

        {/* Input Add Task */}
        <div className="relative group mb-8 shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <svg className={`w-5 h-5 transition-colors ${dark ? "text-zinc-500 group-focus-within:text-violet-400" : "text-neutral-400 group-focus-within:text-violet-500"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input
            className={`w-full pl-12 pr-28 py-4 sm:py-5 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-inner text-base
              ${dark ? "bg-black/40 border-white/10 text-white placeholder-zinc-500 focus:border-violet-500" : "bg-white/80 border-black/5 text-neutral-900 placeholder-neutral-400 focus:border-violet-400"}`}
            placeholder={editId ? "Update your task..." : "What needs to be done?"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            autoFocus
          />
          <button
            onClick={addTask}
            disabled={!input.trim()}
            className={`absolute right-2 top-2 bottom-2 px-6 rounded-xl font-bold tracking-wide transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed
              ${dark
                ? "bg-violet-600 hover:bg-violet-500 text-white shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:shadow-[0_0_20px_rgba(124,58,237,0.5)]"
                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
              }`}
          >
            {editId ? "Save" : "Add"}
          </button>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className={`flex flex-1 p-1 rounded-2xl border ${dark ? "bg-black/20 border-white/5" : "bg-white/60 border-black/5"}`}>
            {(["all", "active", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex-1 py-2 sm:py-2.5 rounded-xl text-sm font-bold capitalize transition-all duration-300 ${filter === f
                  ? `${dark ? "bg-zinc-800 text-white shadow-md shadow-black/40" : "bg-white text-indigo-700 shadow-md shadow-black/5"}`
                  : `${dark ? "text-zinc-500 hover:text-zinc-200 hover:bg-white/5" : "text-neutral-500 hover:text-neutral-800 hover:bg-black/5"}`
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className={`w-4 h-4 transition-colors ${dark ? "text-zinc-500" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              className={`w-full h-full min-h-[44px] sm:min-h-[48px] pl-10 pr-4 rounded-2xl border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm
                 ${dark ? "bg-black/20 border-white/5 text-zinc-200 placeholder-zinc-600" : "bg-white/60 border-black/5 text-neutral-800 placeholder-neutral-400"}`}
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Task List */}
        <div className={`rounded-3xl border overflow-hidden transition-colors shadow-sm ${dark ? "bg-black/40 border-white/10" : "bg-white/80 border-black/5"}`}>
          <ul className="max-h-[50vh] overflow-y-auto divide-y divide-zinc-200/50 dark:divide-white/5 
             [&::-webkit-scrollbar]:w-2
             [&::-webkit-scrollbar-track]:bg-transparent
             [&::-webkit-scrollbar-thumb]:bg-zinc-300
             dark:[&::-webkit-scrollbar-thumb]:bg-zinc-700
             [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {filteredTasks.length === 0 ? (
              <li className="p-12 flex flex-col items-center justify-center text-center opacity-80">
                <div className={`p-4 rounded-3xl mb-5 ${dark ? "bg-zinc-900/50" : "bg-neutral-100"}`}>
                  <svg className={`w-10 h-10 ${dark ? "text-zinc-600" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <p className={`font-medium ${dark ? "text-zinc-400" : "text-neutral-500"}`}>
                  {search ? "No matching tasks found." : filter === "active" ? "You have no active tasks." : filter === "done" ? "No completed tasks yet." : "You have no tasks."}
                </p>
              </li>
            ) : filteredTasks.map((t) => (
              <li
                key={t.id}
                className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 px-5 sm:px-6 transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/[0.03]"
              >
                <div className="flex items-center gap-4 flex-1 cursor-pointer w-full" onClick={() => toggleTask(t)}>
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-[2.5px] flex items-center justify-center transition-all duration-300
                     ${t.done
                      ? "bg-violet-500 border-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.5)]"
                      : "border-zinc-300 dark:border-zinc-600 group-hover:border-violet-400"
                    }`}
                  >
                    <svg className={`w-3.5 h-3.5 text-white transition-opacity duration-300 ${t.done ? "opacity-100" : "opacity-0"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span
                    className={`flex-1 text-base sm:text-lg font-medium transition-all duration-300 break-words line-clamp-3 ${t.done ? `line-through ${dark ? "text-zinc-600" : "text-neutral-400"}` : dark ? "text-zinc-200" : "text-neutral-800"
                      }`}
                  >
                    {t.text}
                  </span>
                </div>

                <div className="flex gap-1.5 sm:opacity-0 sm:group-hover:opacity-100 sm:-translate-x-2 sm:group-hover:translate-x-0 transition-all duration-300 focus-within:opacity-100 ml-10 flex-shrink-0 mt-3 sm:mt-0 sm:ml-4">
                  <button
                    onClick={(e) => editTask(t, e)}
                    className={`p-2 rounded-xl transition-colors ${dark ? "text-zinc-500 hover:bg-zinc-800 hover:text-blue-400" : "text-neutral-400 hover:bg-neutral-100 hover:text-blue-600"}`}
                    aria-label="Edit task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => deleteTask(t.id, e)}
                    className={`p-2 rounded-xl transition-colors ${dark ? "text-zinc-500 hover:bg-zinc-800 hover:text-red-400" : "text-neutral-400 hover:bg-red-50 hover:text-red-500"}`}
                    aria-label="Delete task"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer Actions */}
        {tasks.length > 0 && (
          <div className="flex justify-between items-center px-1">
            <button
              onClick={clearCompleted}
              className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors opacity-80 hover:opacity-100 ${dark ? "text-zinc-500 hover:bg-zinc-800/80 hover:text-red-400" : "text-neutral-500 hover:bg-neutral-100 hover:text-red-600"}`}
            >
              Clear Completed
            </button>
            <button
              onClick={deleteAll}
              className={`text-sm font-bold px-4 py-2 rounded-xl transition-colors opacity-80 hover:opacity-100 ${dark ? "text-zinc-500 hover:bg-zinc-800/80 hover:text-red-400" : "text-neutral-500 hover:bg-neutral-100 hover:text-red-600"}`}
            >
              Delete All
            </button>
          </div>
        )}

      </div>
    </div>
  );
}