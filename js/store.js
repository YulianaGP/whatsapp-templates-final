// store.js
// LAB 14 (HU1): Store centralizado para manejar el estado de la aplicación 
function createStore(initialState = {}) {
    // Vamos a crear el esatdo principal de mi Store
    let state = {
        plantillas: [],
        modoVista: 'lista',
        filtros: {
            busqueda: '',
            hashtag: ''
        },
        ...initialState
    };
    
    // Observers - funciones que se ejecutan cuando cambia el estado
    const listeners = [];

    // Vamos a usar un metodo para mostrar el valor del state
    // Obtener el estado completo
    function getState() {
        return { ...state }; // Retorna una copia para evitar mutaciones
    }

    // Obtener solo las plantillas
    function getPlantillas() {
        return [...state.plantillas]; // Retorna una copia del array
    }

    // Renderizar: Establecer nuevo estado completo
    // Esta función se va a encargar de manipular el nuevo estado
    function setState(newState) {
        state = { ...state, ...newState };
        notifyListeners();
    }

    // Agregar nueva plantilla
    // Lab 14 (HU2): Inmutabilidad respetada 
    function agregarPlantilla(nuevaPlantilla) {
        // Insertar este nuevo elemento en el array state
        const newState = {
            ...state,
            plantillas: [...state.plantillas, nuevaPlantilla] // ¡Spread operator!
        };
        setState(newState);
    }

    // LAB 14 (HU3): Eliminar plantilla por título
    function eliminarPlantilla(titulo) {
        const nuevasPlantillas = state.plantillas.filter(p => p.titulo !== titulo);
        const newState = {
            ...state,
            plantillas: nuevasPlantillas // ¡Nuevo array!
        };
        setState(newState);
        return true;
    }

    // Buscar plantilla por título
    function buscarPlantilla(titulo) {
        return state.plantillas.find(p => p.titulo.toLowerCase() === titulo.toLowerCase());
    }

    // Actualizar filtros
    function actualizarFiltros(nuevosFiltros) {
        const newState = {
            ...state,
            filtros: { ...state.filtros, ...nuevosFiltros }
        };
        setState(newState);
    }

    // Cambiar modo de vista
    function cambiarModoVista() {
        const nuevoModo = state.modoVista === 'lista' ? 'grilla' : 'lista';
        const newState = {
            ...state,
            modoVista: nuevoModo
        };
        setState(newState);
    }

    // Filtrar plantillas según los filtros actuales
    function filtrarPlantillas() {
        return state.plantillas.filter(template => {
            const coincideBusqueda = template.titulo.toLowerCase().includes(state.filtros.busqueda.toLowerCase()) ||
                                    template.mensaje.toLowerCase().includes(state.filtros.busqueda.toLowerCase());
            
            const coincideHashtag = !state.filtros.hashtag || 
                                   template.hashtag.includes(state.filtros.hashtag) ||
                                   template.categoria.includes(state.filtros.hashtag);
                                   
            return coincideBusqueda && coincideHashtag;
        });
    }

    // Agregar listener para cambios de estado
    function subscribe(listener) {
        listeners.push(listener);
        // Retorna función para desuscribirse
        return () => {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }

    // Notificar a todos los listeners
    function notifyListeners() {
        listeners.forEach(listener => listener(state));
    }

    return {
        getState,
        getPlantillas,
        setState,
        agregarPlantilla,
        eliminarPlantilla,
        buscarPlantilla,
        actualizarFiltros,
        cambiarModoVista,
        filtrarPlantillas,
        subscribe
    };
}

// Crear instancia global del store
const templateStore = createStore();

// Hacer disponible globalmente
window.templateStore = templateStore;
