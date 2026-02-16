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

        const [titulo, descripcion, fechaString, icono] = columns;
        
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

  return (
    <>
      <header>
        <h1 className="text-3xl font-bold text-center p-10 mb-4 rounded-b-xl bg-gray-50">🎉 En Esta Casa Se Celebra 🎉</h1>
      </header>
      <div className="max-w-md mx-auto p-4 font-sans bg-gray-50 rounded-xl">
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

            return (
              <li
                key={day}
                style={day === 0 ? { gridColumnStart: startDay + 1 } : {}}
                onClick={() => setSelectedDayDetail(dayNumber)}
                className={`
                  aspect-square border rounded-xl flex flex-col justify-between items-center p-1 cursor-pointer transition-all
                  ${isSelected ? 'ring-2 ring-indigo-500 border-transparent z-10' : 'border-gray-200'}
                  ${hasEvents ? 'bg-white shadow-sm hover:shadow-md' : 'hover:bg-gray-100'}
                `}
              >
                <span className={`text-xs font-semibold ${hasEvents ? 'text-gray-800' : 'text-gray-400'}`}>
                  {dayNumber}
                </span>

                {/* Iconos (máximo 3 puntitos o iconos para no saturar) */}
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
        
        {/* DETALLE DE EVENTOS (Panel Inferior) */}
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
      </div>
      <footer className="mt-4 bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <div className="flex flex-col items-center text-indigo-600">
            <p className="text-lg font-bold">Los Gomez los Gonzalez Celebran</p>
          </div>
          <div className="flex flex-col items-center text-gray-400 hover:text-indigo-400 transition cursor-pointer" 
              onClick={() => window.open('https://docs.google.com/forms/d/e/1FAIpQLSfjg5_DUWEFuwwi4PrvIKigbPC9ZF2fu342Ox6fCK27U3eEIg/viewform?usp=publish-editor', '_blank')}>
            <span className="text-xl">➕</span>
            <span className="text-[10px] font-bold uppercase tracking-tighter">Nuevo Evento</span>
          </div>
        </div>
      </footer>
    </>
  )
}

export default App