import { useState, useEffect } from "react"

// URL 1: Eventos Fijos (La que ya tenías)
const FIXED_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK0K8Sm6UEvmeBz8dCz_WI8j7GO3F6XAfI5J8c0ZAHqwMKXtjyTtXk7yTCUu-g302uJ8dH_OxyqPrX/pub?gid=954616486&single=true&output=tsv";
// URL 2: Eventos Ocasionales (La del Google Form)
const OCCASIONAL_SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTK0K8Sm6UEvmeBz8dCz_WI8j7GO3F6XAfI5J8c0ZAHqwMKXtjyTtXk7yTCUu-g302uJ8dH_OxyqPrX/pub?gid=853423287&single=true&output=tsv";

function App() {
  const date = new Date()
  
  // --- Estados de Fecha ---
  const [selectedMonth, setSelectedMonth] = useState(date.getMonth())
  const [selectedYear, setSelectedYear] = useState(date.getFullYear())
  
  // --- Estados de Datos ---
  const [fixedEvents, setFixedEvents] = useState([])
  const [occasionalEvents, setOccasionalEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // --- Estado para la Interacción (Día seleccionado para ver detalles) ---
  const [selectedDayDetail, setSelectedDayDetail] = useState(null)

  const locale = "es"
  const intl = new Intl.DateTimeFormat(locale, { month: "long" })

  // --- 1. Carga de Datos ---
  useEffect(() => {
    // Usamos Promise.all para cargar ambas hojas simultáneamente
    Promise.all([
      fetch(FIXED_SHEET_URL).then(res => res.text()),
      fetch(OCCASIONAL_SHEET_URL).then(res => res.text())
    ]).then(([fixedText, occasionalText]) => {
      
      // A) Procesar Fijos (Formato: Dia | Mes | Titulo | Desc | Icono)
      const fixedRows = fixedText.split("\n").slice(1);
      const parsedFixed = fixedRows.map(row => {
        const [dia, mes, titulo, descripcion, icono] = row.split("\t");
        return {
          type: 'fijo',
          dia: parseInt(dia),
          mes: parseInt(mes),
          titulo,
          descripcion,
          icono: icono?.trim()
        };
      }).filter(e => !isNaN(e.dia)); // Filtro de seguridad

      // B) Procesar Ocasionales (Formato: Timestamp | Titulo | Desc | FECHA | Icono)
      const occasionalRows = occasionalText.split("\n").slice(1);
      const parsedOccasional = occasionalRows.map(row => {
        const columns = row.split("\t");
        // Aseguramos que la fila tenga datos
        if (columns.length < 4) return null;

        const [_,titulo, descripcion, fechaString, icono] = columns;
        
        // Parsear fecha "DD/MM/YYYY" (ej: 27/02/2026)
        // Ojo: Si tu excel está en inglés podría ser MM/DD/YYYY. Asumo formato latino.
        const [diaStr, mesStr, anioStr] = fechaString.split("/");
        
        return {
          type: 'ocasional',
          dia: parseInt(diaStr),
          mes: parseInt(mesStr),
          anio: parseInt(anioStr),
          titulo,
          descripcion,
          icono: icono?.trim()
        };
      }).filter(e => e !== null && !isNaN(e.dia));

      setFixedEvents(parsedFixed);
      setOccasionalEvents(parsedOccasional);
      setLoading(false);
    }).catch(err => console.error("Error cargando datos:", err));
  }, []);

  // --- Navegación ---
  const handlePrevMonth = () => {
    setSelectedDayDetail(null); // Limpiamos detalle al cambiar mes
    if (selectedMonth === 0) {
      setSelectedMonth(11); setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }

  const handleNextMonth = () => {
    setSelectedDayDetail(null);
    if (selectedMonth === 11) {
      setSelectedMonth(0); setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }

  // --- Lógica del Calendario ---
  const monthName = intl.format(new Date(selectedYear, selectedMonth, 1))
  const daysOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate()
  const startDay = new Date(selectedYear, selectedMonth, 1).getDay()
  const days = [...Array(daysOfMonth).keys()]

  // Función para obtener TODOS los eventos de un día (Fijos + Ocasionales)
  const getEventsForDay = (dayNumber) => {
    const currentMonthReal = selectedMonth + 1;

    // 1. Fijos: Coinciden en Día y Mes (se repiten todos los años)
    const fijos = fixedEvents.filter(e => 
      e.dia === dayNumber && e.mes === currentMonthReal
    );

    // 2. Ocasionales: Coinciden Día, Mes Y AÑO
    const ocasionales = occasionalEvents.filter(e => 
      e.dia === dayNumber && 
      e.mes === currentMonthReal && 
      e.anio === selectedYear
    );

    return [...fijos, ...ocasionales];
  }

  // Eventos del día seleccionado para mostrar abajo
  const selectedDayEvents = selectedDayDetail ? getEventsForDay(selectedDayDetail) : [];

  const [openInfo, setOpenInfo] = useState(false);
  return (
    <section className="flex flex-col min-h-screen">
      <header className="mb-4 top-0 left-0 right-0 rounded-b-xl bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 z-30">
        <h1 className="text-3xl font-bold text-center p-4">🎉 En Esta Casa Se Celebra 🎉</h1>
      </header>
      <main className="flex-1 max-w-md mx-auto p-4 font-sans bg-gray-50 rounded-xl">
        <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
          <button onClick={handlePrevMonth} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">⏮</button>
          <h2 className="capitalize font-bold text-xl text-gray-800">{monthName} {selectedYear}</h2>
          <button onClick={handleNextMonth} className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200">⏭</button>
        </header>

        <ol className="grid grid-cols-7 text-center text-gray-400 font-bold mb-2 text-xs">
          <li>D</li><li>L</li><li>M</li><li>X</li><li>J</li><li>V</li><li>S</li>
        </ol>

        <ol className="grid grid-cols-7 gap-2 mb-8">
          {days.map((day) => {
            const dayNumber = day + 1;
            const dayEvents = getEventsForDay(dayNumber);
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDayDetail === dayNumber;
            const today = dayNumber === date.getDate() && selectedMonth === date.getMonth() && selectedYear === date.getFullYear();
            return (
              <li
                key={day}
                style={day === 0 ? { gridColumnStart: startDay + 1 } : {}}
                onClick={() => setSelectedDayDetail(dayNumber)}
                className={`
                  aspect-square border rounded-xl flex flex-col justify-between items-center p-1 cursor-pointer transition-all
                  ${isSelected ? 'ring-2 ring-indigo-500 border-transparent z-10' : 'border-gray-200'}
                  ${hasEvents ? 'bg-white shadow-sm hover:shadow-md' : 'hover:bg-gray-100'}
                  ${today ? 'bg-indigo-400 text-white' : ''}
                `}
              >
                <span className={`text-xs font-semibold ${hasEvents ? 'text-gray-800' : 'text-gray-400'}`}>
                  {dayNumber}
                </span>

                <div className="flex flex-wrap justify-center gap-0.5 w-full overflow-hidden h-8">
                  {dayEvents.slice(0, 2).map((evt, idx) => (
                    <span key={idx} className="text-xs leading-none">{evt.icono}</span>
                  ))}
                  {dayEvents.length > 2 && <span className="text-xs">➕</span>}
                </div>
              </li>
            )
          })}
        </ol>
        
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-b pb-2">
            {selectedDayDetail 
              ? `Eventos del ${selectedDayDetail} de ${monthName}` 
              : "Selecciona un día"}
          </h3>

          {selectedDayDetail && selectedDayEvents.length === 0 && (
            <p className="text-gray-400 italic text-sm">No hay celebraciones para este día... ¡Inventa una!</p>
          )}

          <div className="space-y-3">
            {selectedDayEvents.map((evt, index) => (
              <div key={index} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition">
                <span className="text-2xl bg-gray-100 p-2 rounded-full h-10 w-10 flex items-center justify-center">
                  {evt.icono}
                </span>
                <div>
                  <h4 className="font-bold text-gray-800 flex items-center gap-2">
                    {evt.titulo}
                    {/* Etiqueta para diferenciar tipos */}
                    {evt.type === 'fijo' 
                      ? <span className="text-[10px] uppercase tracking-wider bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Anual</span>
                      : <span className="text-[10px] uppercase tracking-wider bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">Ocasional</span>
                    }
                  </h4>
                  <p className="text-sm text-gray-600 mt-0.5">{evt.descripcion}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        {loading && <div className="fixed inset-0 bg-white/80 flex items-center justify-center">
          <span className="animate-pulse text-indigo-600 font-bold">Cargando fiestas...</span>
        </div>}
        {openInfo && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div 
              className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
              onClick={() => setOpenInfo(false)}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full border border-gray-100 animate-in zoom-in duration-200">
              <button 
                onClick={() => setOpenInfo(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>

              <div className="text-center">
                <span className="text-4xl mb-4 block">🏠</span>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  En Esta Casa Se Celebra
                </h3>
                
                <div className="text-sm text-gray-600 text-left space-y-3 leading-relaxed">
                  <p>
                    ¡Hola! Soy <strong>Lucas</strong>. Este proyecto nació de una convicción simple: la vida es mejor cuando se celebra.
                  </p>
                  <p>
                    Para mi novia y para mí, siempre hay "excusas" para juntarnos con seres queridos. Si no hay un motivo, lo inventamos.
                  </p>
                  <p>
                    En la casa de los <strong>Gómez y los González</strong>, el festejo es parte de nuestra cultura. Creé esta app para tener esos eventos siempre presentes.
                  </p>
                  <img
                    src="op.png"
                    alt="one piece jolly roger"
                    className="w-12 mx-auto"
                  />
                </div>

                <div className="flex justify-center gap-6 mt-4 pt-6 border-t border-gray-100">
                  <a 
                    href="https://instagram.com/TU_USUARIO" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">📸</span>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-pink-500 uppercase">Instagram</span>
                  </a>
                  
                  <a 
                    href="https://github.com/TU_USUARIO" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex flex-col items-center group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">💻</span>
                    <span className="text-[10px] font-bold text-gray-400 group-hover:text-black uppercase">GitHub</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <footer className="mt-4 bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-30">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <a className="group flex flex-col items-center text-gray-400 hover:text-indigo-400 transition cursor-pointer" 
            href="https://docs.google.com/spreadsheets/d/1S83GnjUOk56dbL0iHlnkFHeDIBOVwA8mRd7-KJ2HEiE/edit?usp=sharing"
            target="_blank"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">📅</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Modificar eventos</span>
          </a>
          <a className="group flex flex-col items-center text-gray-400 hover:text-indigo-400 transition cursor-pointer" 
            href="https://docs.google.com/forms/d/e/1FAIpQLSfjg5_DUWEFuwwi4PrvIKigbPC9ZF2fu342Ox6fCK27U3eEIg/viewform?usp=publish-editor"
            target="_blank"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">➕</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Cargar Nuevo Evento</span>
          </a>
          <button className="group flex flex-col items-center text-gray-400 hover:text-indigo-400 transition cursor-pointer"
            onClick={() => setOpenInfo(!openInfo)}
          >
            <span className="text-xl group-hover:scale-110 transition-transform">🧙‍♂️</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Sobre el Proyecto</span>
          </button>
        </div>
      </footer>
    </section>
  )
}

export default App