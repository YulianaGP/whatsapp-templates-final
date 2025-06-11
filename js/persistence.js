// persistence.js
// LAB 15: Persistencia con JSON y LocalStorage
// Integración con el Store centralizado existente

// Constante para la clave de LocalStorage
const STORAGE_KEY = 'whatsapp_templates_data';

// HU1: Guardar plantillas en LocalStorage
function guardarPlantillas() {
    try {
        // Obtener el estado actual del store
        const estadoActual = window.templateStore.getState();
        
        // Serializar el estado completo a JSON
        const datosParaGuardar = JSON.stringify(estadoActual);
        
        // Guardar en LocalStorage
        localStorage.setItem(STORAGE_KEY, datosParaGuardar);
        
        console.log('✅ Plantillas guardadas en LocalStorage');
        return true;
    } catch (error) {
        console.error('❌ Error al guardar plantillas:', error);
        mostrarNotificacion('Error al guardar plantillas', 'error');
        return false;
    }
}

// HU2: Cargar plantillas desde LocalStorage
function cargarPlantillas() {
    try {
        // Obtener datos desde LocalStorage
        const datosGuardados = localStorage.getItem(STORAGE_KEY);
        
        // Usar operador ternario para manejar caso inicial vacío
        const estadoCargado = datosGuardados ? JSON.parse(datosGuardados) : null;
        
        // Si hay datos válidos, cargarlos en el store
        if (estadoCargado && estadoCargado.plantillas) {
            // Validar estructura de datos
            if (Array.isArray(estadoCargado.plantillas)) {
                // Restaurar fechas de creación (JSON convierte Date a string)
                const plantillasConFechas = estadoCargado.plantillas.map(plantilla => ({
                    ...plantilla,
                    fechaCreacion: new Date(plantilla.fechaCreacion)
                }));
                
                // Actualizar estado en el store manteniendo la estructura
                const nuevoEstado = {
                    ...estadoCargado,
                    plantillas: plantillasConFechas
                };
                
                window.templateStore.setState(nuevoEstado);
                console.log(`✅ ${plantillasConFechas.length} plantillas cargadas desde LocalStorage`);
                return true;
            }
        }
        
        console.log('ℹ️ No hay plantillas guardadas, iniciando con estado vacío');
        return false;
    } catch (error) {
        console.error('❌ Error al cargar plantillas:', error);
        mostrarNotificacion('Error al cargar plantillas guardadas', 'error');
        return false;
    }
}

// HU3: Eliminar todas las plantillas (Reset)
function resetearPlantillas() {
    try {
        // Limpiar LocalStorage
        localStorage.removeItem(STORAGE_KEY);
        
        // Resetear el store al estado inicial
        const estadoInicial = {
            plantillas: [],
            modoVista: 'lista',
            filtros: {
                busqueda: '',
                hashtag: ''
            }
        };
        
        window.templateStore.setState(estadoInicial);
        
        console.log('✅ Todas las plantillas eliminadas');
        mostrarNotificacion('Todas las plantillas han sido eliminadas', 'success');
        return true;
    } catch (error) {
        console.error('❌ Error al resetear plantillas:', error);
        mostrarNotificacion('Error al eliminar plantillas', 'error');
        return false;
    }
}

// Función para validar datos de LocalStorage (Logro Adicional 2)
function validarDatosLocalStorage(datos) {
    if (!datos || typeof datos !== 'object') return false;
    
    // Validar estructura mínima requerida
    const estructura = {
        plantillas: Array.isArray(datos.plantillas),
        modoVista: typeof datos.modoVista === 'string',
        filtros: datos.filtros && typeof datos.filtros === 'object'
    };
    
    return Object.values(estructura).every(valido => valido);
}

// Función para mostrar el tamaño de datos en LocalStorage
function obtenerEstadisticasStorage() {
    try {
        const datos = localStorage.getItem(STORAGE_KEY);
        const tamaño = datos ? new Blob([datos]).size : 0;
        const plantillas = datos ? JSON.parse(datos).plantillas?.length || 0 : 0;
        
        return {
            tamaño: tamaño,
            tamañoLegible: formatearTamaño(tamaño),
            plantillas: plantillas,
            disponible: true
        };
    } catch (error) {
        return {
            tamaño: 0,
            tamañoLegible: '0 B',
            plantillas: 0,
            disponible: false,
            error: error.message
        };
    }
}

// Función auxiliar para formatear tamaños
function formatearTamaño(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función para exportar plantillas como JSON (Funcionalidad extra)
function exportarPlantillas() {
    try {
        const estadoActual = window.templateStore.getState();
        const datosExportacion = {
            plantillas: estadoActual.plantillas,
            fechaExportacion: new Date().toISOString(),
            version: '1.0'
        };
        
        const jsonString = JSON.stringify(datosExportacion, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `plantillas_whatsapp_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        mostrarNotificacion('Plantillas exportadas correctamente', 'success');
    } catch (error) {
        console.error('❌ Error al exportar:', error);
        mostrarNotificacion('Error al exportar plantillas', 'error');
    }
}

// Función para importar plantillas desde JSON (Funcionalidad extra)
function importarPlantillas(archivo) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const datosImportados = JSON.parse(e.target.result);
            
            if (datosImportados.plantillas && Array.isArray(datosImportados.plantillas)) {
                // Agregar plantillas importadas a las existentes
                const estadoActual = window.templateStore.getState();
                const plantillasExistentes = estadoActual.plantillas;
                
                // Evitar duplicados por título
                const nuevasPlantillas = datosImportados.plantillas.filter(nueva => 
                    !plantillasExistentes.some(existente => existente.titulo === nueva.titulo)
                );
                
                if (nuevasPlantillas.length > 0) {
                    nuevasPlantillas.forEach(plantilla => {
                        window.templateStore.agregarPlantilla({
                            ...plantilla,
                            fechaCreacion: new Date(plantilla.fechaCreacion || Date.now())
                        });
                    });
                    
                    guardarPlantillas(); // Persistir los cambios
                    renderPlantillas();
                    actualizarEstadisticas();
                    actualizarOpcionesHashtag();
                    
                    mostrarNotificacion(`${nuevasPlantillas.length} plantillas importadas correctamente`, 'success');
                } else {
                    mostrarNotificacion('No se importaron plantillas (posibles duplicados)', 'info');
                }
            } else {
                mostrarNotificacion('Formato de archivo inválido', 'error');
            }
        } catch (error) {
            console.error('❌ Error al importar:', error);
            mostrarNotificacion('Error al importar plantillas', 'error');
        }
    };
    reader.readAsText(archivo);
}

// Función para verificar disponibilidad de LocalStorage
function verificarLocalStorage() {
    try {
        const test = 'test_storage';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (error) {
        console.error('❌ LocalStorage no disponible:', error);
        return false;
    }
}

// Auto-guardar después de cada operación CRUD (Integration con Store existente)
function integrarAutoGuardadoMejorado() {
    // Interceptar las funciones del store para auto-guardar
    const storeOriginal = window.templateStore;
    
    // Guardar referencias a funciones originales
    const agregarOriginal = storeOriginal.agregarPlantilla;
    const eliminarOriginal = storeOriginal.eliminarPlantilla;
    const setStateOriginal = storeOriginal.setState;
    
    // Sobrescribir con auto-guardado mejorado
    storeOriginal.agregarPlantilla = function(plantilla) {
        const resultado = agregarOriginal.call(this, plantilla);
        const exito = guardarPlantillas();
        mostrarEstadoGuardado(exito, 'guardado');
        return resultado;
    };
    
    storeOriginal.eliminarPlantilla = function(titulo) {
        const resultado = eliminarOriginal.call(this, titulo);
        const exito = guardarPlantillas();
        mostrarEstadoGuardado(exito, 'eliminado');
        return resultado;
    };
    
    storeOriginal.setState = function(nuevoEstado) {
        const resultado = setStateOriginal.call(this, nuevoEstado);
        // Solo auto-guardar si cambiaron las plantillas
        if (nuevoEstado.plantillas) {
            const exito = guardarPlantillas();
            mostrarEstadoGuardado(exito, 'actualizado');
        }
        return resultado;
    };
}

// Inicialización de la persistencia
function inicializarPersistencia() {
    if (!verificarLocalStorage()) {
        console.warn('⚠️ LocalStorage no disponible, funcionando solo en memoria');
        mostrarNotificacion('Almacenamiento local no disponible', 'error');
        return false;
    }
    
    // Cargar plantillas al iniciar
    const cargaExitosa = cargarPlantillas();
    
    // Integrar auto-guardado
    integrarAutoGuardadoMejorado();
    
    // Configurar sincronización
    configurarSincronizacionMejorada();
    
    // Configurar sistema de recuperación
    configurarSistemaRecuperacion();
    
    // Crear indicadores de estado
    setTimeout(() => {
        crearIndicadorEstadoAlmacenamiento();
    }, 1000);

    console.log('✅ Sistema de persistencia inicializado');
    return cargaExitosa;
}

// Hacer funciones disponibles globalmente
window.persistencia = {
    guardar: guardarPlantillas,
    cargar: cargarPlantillas,
    resetear: resetearPlantillas,
    exportar: exportarPlantillas,
    importar: importarPlantillas,
    estadisticas: obtenerEstadisticasStorage,
    inicializar: inicializarPersistencia
};

// ===============================
// LABORATORIO 16: MEJORAS PARA PERSISTENCIA Y SINCRONIZACIÓN
// ===============================

// 1. MEJORAS PARA persistence.js - HU1: Guardado automático mejorado
// Agregar estas funciones a persistence.js

// Función para mostrar estado de guardado automático
function mostrarEstadoGuardado(exito = true, operacion = 'guardado') {
    const statusIndicator = document.getElementById('save-status') || crearIndicadorEstado();
    
    if (exito) {
        statusIndicator.innerHTML = `
            <i class="fas fa-check-circle text-green-500"></i>
            <span class="text-green-600 text-sm">Auto-${operacion} exitoso</span>
        `;
        statusIndicator.className = 'flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 rounded-lg';
    } else {
        statusIndicator.innerHTML = `
            <i class="fas fa-exclamation-triangle text-red-500"></i>
            <span class="text-red-600 text-sm">Error en auto-${operacion}</span>
        `;
        statusIndicator.className = 'flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 rounded-lg';
    }
    
    // Auto-ocultar después de 3 segundos
    setTimeout(() => {
        statusIndicator.style.opacity = '0.5';
    }, 3000);
    
    setTimeout(() => {
        statusIndicator.style.opacity = '1';
    }, 5000);

    // Desaparece el mensaje después de unos segundos
    setTimeout(() => {
        statusIndicator.innerHTML = '';
    }, 3000);
}

// Crear indicador de estado si no existe
function crearIndicadorEstado() {
    const indicator = document.createElement('div');
    indicator.id = 'save-status';
    indicator.className = 'fixed bottom-4 right-4 z-50 transition-all duration-300';
    document.body.appendChild(indicator);
    return indicator;
}

// ===============================
// 2. MEJORAS PARA app.js - HU2 y HU3 LAB 16
// ===============================

// Sistema de sincronización mejorado
function configurarSincronizacionMejorada() {
    // Suscribirse a cambios del store para sincronización automática
    window.templateStore.subscribe(function(nuevoEstado) {
        console.log('🔄 Estado actualizado, sincronizando UI...');
        
        // Sincronizar interfaz inmediatamente
        renderPlantillas();
        actualizarEstadisticas();
        actualizarOpcionesHashtag();
        mostrarEstadisticasStorage();
        
        // Mostrar feedback visual de sincronización
        mostrarIndicadorSincronizacion();
    });
}

// Indicador visual de sincronización
function mostrarIndicadorSincronizacion() {
    const syncIndicator = document.getElementById('sync-indicator') || crearIndicadorSincronizacion();
    
    syncIndicator.style.opacity = '1';
    syncIndicator.innerHTML = `
        <i class="fas fa-sync-alt fa-spin text-blue-500"></i>
        <span class="text-blue-600 text-sm">Sincronizando...</span>
    `;
    
    setTimeout(() => {
        syncIndicator.innerHTML = `
            <i class="fas fa-check text-green-500"></i>
            <span class="text-green-600 text-sm">Sincronizado</span>
        `;
        
        setTimeout(() => {
            syncIndicator.style.opacity = '0';
        }, 1000);
    }, 500);
}

function crearIndicadorSincronizacion() {
    const indicator = document.createElement('div');
    indicator.id = 'sync-indicator';
    indicator.className = 'fixed bottom-4 left-4 z-50 flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 rounded-lg shadow-lg transition-all duration-300';
    indicator.style.opacity = '0';
    document.body.appendChild(indicator);
    return indicator;
}


// ===============================
// 3. LOGROS ADICIONALES
// ===============================

// Logro 1: Indicador del estado de almacenamiento mejorado
function crearIndicadorEstadoAlmacenamiento() {
    const stats = window.persistencia.estadisticas();
    
    const statusBar = document.createElement('div');
    statusBar.id = 'storage-status-bar';
    statusBar.className = 'bg-gray-50 border-t border-gray-200 px-4 py-2 text-center';
    statusBar.innerHTML = `
        <div class="flex items-center justify-center gap-4 text-sm text-gray-600">
            <div class="flex items-center gap-1">
                <i class="fas fa-database text-blue-500"></i>
                <span>Almacenamiento: ${stats.tamañoLegible}</span>
            </div>
            <div class="flex items-center gap-1">
                <i class="fas fa-file-alt text-green-500"></i>
                <span>${stats.plantillas} plantillas guardadas</span>
            </div>
            <div class="flex items-center gap-1">
                <i class="fas fa-wifi text-${stats.disponible ? 'green' : 'red'}-500"></i>
                <span>Estado: ${stats.disponible ? 'Conectado' : 'Sin conexión'}</span>
            </div>
            <div id="last-sync" class="flex items-center gap-1">
                <i class="fas fa-clock text-gray-400"></i>
                <span>Última sincronización: ${new Date().toLocaleTimeString()}</span>
            </div>
        </div>
    `;
    
    // Agregar al final del body
    document.body.appendChild(statusBar);
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        const lastSync = statusBar.querySelector('#last-sync span');
        if (lastSync) {
            lastSync.textContent = `Última sincronización: ${new Date().toLocaleTimeString()}`;
        }
    }, 30000);
}

// Logro 2: Sistema de recuperación de plantilla eliminada
let ultimaPlantillaEliminada = null;
let timerRecuperacion = null;

function configurarSistemaRecuperacion() {
    // Interceptar eliminación para guardar backup
    const eliminarOriginal = window.templateStore.eliminarPlantilla;
    
    window.templateStore.eliminarPlantilla = function(titulo) {
        // Guardar la plantilla antes de eliminarla
        ultimaPlantillaEliminada = window.templateStore.buscarPlantilla(titulo);
        
        const resultado = eliminarOriginal.call(this, titulo);
        
        if (ultimaPlantillaEliminada) {
            mostrarBotonRecuperacion();
        }
        
        return resultado;
    };
}

function mostrarBotonRecuperacion() {
    // Limpiar timer anterior si existe
    if (timerRecuperacion) {
        clearTimeout(timerRecuperacion);
    }
    
    // Crear botón de recuperación
    let recoveryButton = document.getElementById('recovery-button');
    if (!recoveryButton) {
        recoveryButton = document.createElement('div');
        recoveryButton.id = 'recovery-button';
        recoveryButton.className = 'fixed bottom-20 right-4 z-50';
        document.body.appendChild(recoveryButton);
    }
    
    recoveryButton.innerHTML = `
        <div class="bg-orange-500 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-orange-600 transition duration-300 cursor-pointer flex items-center gap-2">
            <i class="fas fa-undo"></i>
            <span>Recuperar "${ultimaPlantillaEliminada.titulo}"</span>
            <button class="ml-2 text-orange-200 hover:text-white">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Event listener para recuperar
    recoveryButton.querySelector('div').addEventListener('click', (e) => {
        if (!e.target.closest('button')) {
            recuperarUltimaPlantilla();
        }
    });
    
    // Event listener para cerrar
    recoveryButton.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        ocultarBotonRecuperacion();
    });
    
    // Auto-ocultar después de 15 segundos
    timerRecuperacion = setTimeout(() => {
        ocultarBotonRecuperacion();
    }, 15000);
}

function recuperarUltimaPlantilla() {
    if (ultimaPlantillaEliminada) {
        window.templateStore.agregarPlantilla(ultimaPlantillaEliminada);
        mostrarNotificacion(`Plantilla "${ultimaPlantillaEliminada.titulo}" recuperada exitosamente`, 'success');
        ultimaPlantillaEliminada = null;
        ocultarBotonRecuperacion();
    }
}

function ocultarBotonRecuperacion() {
    const recoveryButton = document.getElementById('recovery-button');
    if (recoveryButton) {
        recoveryButton.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(recoveryButton)) {
                document.body.removeChild(recoveryButton);
            }
        }, 300);
    }
    
    if (timerRecuperacion) {
        clearTimeout(timerRecuperacion);
        timerRecuperacion = null;
    }
}
