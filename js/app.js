// Event Listeners para botones de acción
function agregarEventListeners() {
    // Botones de copiar
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const titulo = e.currentTarget.dataset.titulo;
            const template = window.templateStore.buscarPlantilla(titulo);
            if (template) {
                // Crear instancia temporal para obtener el texto formateado
                const tempTemplate = new Template(
                    template.titulo,
                    template.mensaje,
                    template.hashtag,
                    template.categoria,
                    template.autor
                );
                
                navigator.clipboard.writeText(tempTemplate.getTextoParaCopiar()).then(() => {
                    mostrarNotificacion('Plantilla copiada al portapapeles', 'success');
                });
            }
        });
    });
    
    // Botones de eliminar
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const titulo = e.currentTarget.dataset.titulo;
            
            // Usar confirmación mejorada en lugar del confirm() básico
            confirmarEliminacionMejorada(titulo, (confirmado) => {
                if (confirmado) {
                    window.templateStore.eliminarPlantilla(titulo);
                    mostrarNotificacion('Plantilla eliminada correctamente', 'success');
                    renderPlantillas();
                    actualizarEstadisticas();
                    actualizarOpcionesHashtag();
                }
            });
        });
    });
    
    // Botones de editar
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const titulo = e.currentTarget.dataset.titulo;
            const template = window.templateStore.buscarPlantilla(titulo);
            if (template) {
                cargarPlantillaEnFormulario(template);
            }
        });
    });
}

// MODIFICACIONES PARA app.js - INTEGRAR CON PERSISTENCIA

// 1. Agregar función para manejar el botón "Eliminar Todo" (HU3)
function agregarBotonEliminarTodo() {
    // Buscar el contenedor de estadísticas o un lugar apropiado
    const statsContainer = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-4.gap-4');
    
    if (statsContainer) {
        // Crear botón de eliminar todo
        const resetButton = document.createElement('div');
        resetButton.className = 'bg-red-50 border border-red-200 rounded-lg p-4 text-center hover:bg-red-100 transition cursor-pointer';
        resetButton.innerHTML = `
            <div class="flex flex-col items-center">
                <i class="fas fa-trash-alt text-red-500 text-2xl mb-2"></i>
                <p class="text-red-700 font-semibold text-sm">Eliminar Todo</p>
                <p class="text-red-500 text-xs mt-1">Limpiar todas las plantillas</p>
            </div>
        `;
        
        // Event listener para confirmar y eliminar
        resetButton.addEventListener('click', function() {
            const confirmacion = confirm(
                '⚠️ ¿Estás seguro de eliminar TODAS las plantillas?\n\n' +
                'Esta acción no se puede deshacer y eliminará todas las plantillas guardadas tanto en la aplicación como en el almacenamiento local.'
            );
            
            if (confirmacion) {
                window.persistencia.resetear();
                renderPlantillas();
                actualizarEstadisticas();
                actualizarOpcionesHashtag();
            }
        });
        
        // Agregar al contenedor de estadísticas
        statsContainer.appendChild(resetButton);
    }
}

// 2. Agregar botones de exportar/importar
function agregarBotonesImportExport() {
    // Buscar el área de filtros o crear una nueva sección
    const filtersSection = document.querySelector('.flex.flex-col.lg\\:flex-row.gap-4.mb-6');
    
    if (filtersSection) {
        const importExportDiv = document.createElement('div');
        importExportDiv.className = 'flex gap-2 justify-center lg:justify-end';
        importExportDiv.innerHTML = `
            <button id="export-btn" class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-300 flex items-center gap-2 text-sm">
                <i class="fas fa-download"></i>
                <span>Exportar</span>
            </button>
            <label for="import-file" class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300 flex items-center gap-2 text-sm cursor-pointer">
                <i class="fas fa-upload"></i>
                <span>Importar</span>
            </label>
            <input type="file" id="import-file" accept=".json" class="hidden">
        `;
        
        filtersSection.appendChild(importExportDiv);
        
        // Event listeners
        document.getElementById('export-btn').addEventListener('click', function() {
            window.persistencia.exportar();
        });
        
        document.getElementById('import-file').addEventListener('change', function(e) {
            const archivo = e.target.files[0];
            if (archivo) {
                window.persistencia.importar(archivo);
                // Limpiar input
                e.target.value = '';
            }
        });
    }
}

// 3. Función para mostrar estadísticas de almacenamiento
function mostrarEstadisticasStorage() {
    const stats = window.persistencia.estadisticas();
    console.log('📊 Estadísticas de Almacenamiento:', stats);
    
    // Opcional: mostrar en la UI
    const storageInfo = document.createElement('div');
    storageInfo.className = 'text-xs text-gray-500 mt-2 text-center';
    storageInfo.innerHTML = `
        💾 Almacenado: ${stats.tamañoLegible} | 📝 ${stats.plantillas} plantillas guardadas
    `;
    
    // Agregar al final del contenedor principal
    const container = document.querySelector('.container');
    if (container && stats.disponible) {
        const existingInfo = container.querySelector('.storage-info');
        if (existingInfo) {
            existingInfo.remove();
        }
        storageInfo.classList.add('storage-info');
        container.appendChild(storageInfo);
    }
}


// Función para cargar plantilla en formulario para edición
function cargarPlantillaEnFormulario(template) {
    document.getElementById('template-title').value = template.titulo;
    document.getElementById('template-hashtag').value = template.hashtag;
    document.getElementById('template-message').value = template.mensaje;
    
    // Eliminar la plantilla original para "editarla"
    window.templateStore.eliminarPlantilla(template.titulo);
    renderPlantillas();
    actualizarEstadisticas();
    actualizarOpcionesHashtag();
    
    // Cambiar texto del botón
    const saveBtn = document.getElementById('save-template-btn');
    saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Actualizar Plantilla</span>';
    
    // Scroll al formulario
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
}

// Actualizar estadísticas usando datos del store
function actualizarEstadisticas() {
    const plantillas = window.templateStore.getPlantillas();
    const total = plantillas.length;
    const categorias = new Set();
    let recientes = 0;
    
    plantillas.forEach(template => {
        categorias.add(template.hashtag);
        categorias.add(template.categoria);
        
        const dias = (new Date() - new Date(template.fechaCreacion)) / (1000 * 60 * 60 * 24);
        if (dias <= 7) recientes++;
    });
    
    const totalElement = document.getElementById('total-templates');
    const categoriesElement = document.getElementById('total-categories');
    const recentElement = document.getElementById('recent-templates');
    const mostUsedElement = document.getElementById('most-used');
    
    if (totalElement) totalElement.textContent = total;
    if (categoriesElement) categoriesElement.textContent = categorias.size;
    if (recentElement) recentElement.textContent = recientes;
    if (mostUsedElement) mostUsedElement.textContent = Math.min(total, 2); // Simulado
}

// Función para mostrar notificaciones
function mostrarNotificacion(mensaje, tipo = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full`;
    
    const colores = {
        success: 'bg-green-500 text-white',
        error: 'bg-red-500 text-white',
        info: 'bg-blue-500 text-white'
    };
    
    notification.classList.add(...colores[tipo].split(' '));
    notification.textContent = mensaje;
    
    document.body.appendChild(notification);
    
    // Animar entrada
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remover después de 3 segundos
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Actualizar opciones de hashtag en el filtro
function actualizarOpcionesHashtag() {
    const select = document.getElementById('filter-hashtag');
    if (!select) return;

    // Limpiar opciones actuales excepto "Todos los hashtags"
    const valorSeleccionado = select.value;
    select.innerHTML = '<option value="">Todos los hashtags</option>';

    // Extraer hashtags únicos desde el store
    const plantillas = window.templateStore.getPlantillas();
    const hashtagsUnicos = [...new Set(plantillas.map(p => p.hashtag))];

    hashtagsUnicos.forEach(hashtag => {
        const option = document.createElement('option');
        option.value = hashtag;
        option.textContent = `#${hashtag}`;
        select.appendChild(option);
    });

    // Restaurar selección anterior si aún existe
    if (hashtagsUnicos.includes(valorSeleccionado)) {
        select.value = valorSeleccionado;
    }
}

// Función para limpiar formulario
function limpiarFormulario() {
    const inputTitle = document.getElementById('template-title');
    const inputHashtag = document.getElementById('template-hashtag');
    const inputMessage = document.getElementById('template-message');
    const previewContent = document.getElementById('preview-content');
    const charCount = document.getElementById('char-count');
    const saveBtn = document.getElementById('save-template-btn');

    if (inputTitle) inputTitle.value = '';
    if (inputHashtag) inputHashtag.value = '';
    if (inputMessage) inputMessage.value = '';
    
    if (previewContent) {
        previewContent.innerHTML = 'La vista previa aparecerá aquí mientras escribes...';
        previewContent.classList.add('text-gray-400', 'italic');
        previewContent.classList.remove('text-gray-700');
    }
    
    if (charCount) {
        charCount.textContent = '0/1000 caracteres';
        charCount.classList.remove('text-red-500');
        charCount.classList.add('text-gray-400');
    }
    
    // Restaurar botón de guardar
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i><span>Guardar Plantilla</span>';
    }
}

// NUEVA INICIALIZACIÓN CON PERSISTENCIA
document.addEventListener('DOMContentLoaded', function() {
    // ========== INICIALIZAR PERSISTENCIA PRIMERO ==========
    console.log('🚀 Inicializando aplicación con persistencia...');
    
    // Inicializar sistema de persistencia
    const persistenciaInicializada = window.persistencia.inicializar();
    
    // Referencias a elementos del DOM
    const inputTitle = document.getElementById('template-title');
    const inputHashtag = document.getElementById('template-hashtag');
    const inputMessage = document.getElementById('template-message');
    const saveBtn = document.getElementById('save-template-btn');
    const clearBtn = document.getElementById('clear-form-btn');
    const searchInput = document.getElementById('search-templates');
    const filterSelect = document.getElementById('filter-hashtag');
    const previewContent = document.getElementById('preview-content');
    const charCount = document.getElementById('char-count');
    
    // ========== EVENT LISTENERS ==========
    // Event Listener para guardar plantilla (MODIFICADO)
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            const titulo = inputTitle?.value.trim() || '';
            const hashtag = inputHashtag?.value.trim().replace('#', '') || '';
            const mensaje = inputMessage?.value.trim() || '';
            
            // Validación de campos vacíos
            if (!titulo || !hashtag || !mensaje) {
                mostrarNotificacion('Por favor completa todos los campos', 'error');
                return;
            }
            
            // Validación de duplicado por título
            if (window.templateStore.buscarPlantilla(titulo)) {
                mostrarNotificacion('Ya existe una plantilla con ese título', 'error');
                return;
            }
            
            // Extraer categoría del hashtag (primera palabra)
            const hashtags = hashtag.split(' ').filter(h => h.length > 0);
            const categoria = hashtags.length > 1 ? hashtags[1].replace('#', '') : 'general';
            
            const nuevaPlantilla = new Template(
                titulo,
                mensaje,
                hashtags[0].replace('#', ''),
                categoria,
                'Usuario'
            );
            
            // Usar el store para agregar la plantilla (auto-guardado integrado)
            window.templateStore.agregarPlantilla(nuevaPlantilla);
            renderPlantillas();
            actualizarEstadisticas();
            actualizarOpcionesHashtag();
            limpiarFormulario();
            mostrarEstadisticasStorage(); // Actualizar stats de storage
            mostrarNotificacion('Plantilla guardada correctamente', 'success');
        });
    }
    
    // Event Listener para limpiar formulario
    if (clearBtn) {
        clearBtn.addEventListener('click', limpiarFormulario);
    }
    
    // Event Listeners para búsqueda y filtros
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            window.templateStore.actualizarFiltros({ busqueda: this.value });
            renderPlantillas();
        });
    }
    
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            window.templateStore.actualizarFiltros({ hashtag: this.value });
            renderPlantillas();
        });
    }
    
    // Vista previa en tiempo real
    function actualizarVistaPrevia() {
        if (!inputMessage || !previewContent) return;
        
        const mensaje = inputMessage.value;
        if (mensaje.trim()) {
            previewContent.innerHTML = mensaje.replace(/\n/g, '<br>');
            previewContent.classList.remove('text-gray-400', 'italic');
            previewContent.classList.add('text-gray-700');
        } else {
            previewContent.innerHTML = 'La vista previa aparecerá aquí mientras escribes...';
            previewContent.classList.add('text-gray-400', 'italic');
            previewContent.classList.remove('text-gray-700');
        }
    }
    
    // Contador de caracteres
    function actualizarContador() {
        if (!inputMessage || !charCount) return;
        
        const length = inputMessage.value.length;
        charCount.textContent = `${length}/1000 caracteres`;
        
        if (length > 800) {
            charCount.classList.add('text-red-500');
            charCount.classList.remove('text-gray-400');
        } else {
            charCount.classList.remove('text-red-500');
            charCount.classList.add('text-gray-400');
        }
    }
    
    if (inputMessage) {
        inputMessage.addEventListener('input', function() {
            actualizarVistaPrevia();
            actualizarContador();
        });
    }
    
    // ========== CARGAR PLANTILLAS DE EJEMPLO SI ES NECESARIO ==========
    const plantillasExistentes = window.templateStore.getPlantillas();
    
    // Solo agregar ejemplos si no hay plantillas Y no se cargaron desde localStorage
    if (plantillasExistentes.length === 0 && !persistenciaInicializada) {
        console.log('📝 Cargando plantillas de ejemplo...');
        
        const ejemplo1 = new Template(
            'Mensaje de Bienvenida', 
            '¡Hola {nombre}! 👋\n\nBienvenido/a a {empresa}. Estamos emocionados de tenerte como parte de nuestra comunidad.\n\nSi tienes alguna pregunta, no dudes en contactarnos. ¡Estamos aquí para ayudarte!\n\nSaludos cordiales,\nEl equipo de {empresa}', 
            'bienvenida', 
            'nuevos-clientes', 
            'Sistema'
        );
        
        const ejemplo2 = new Template(
            'Seguimiento de Ventas', 
            'Hola {nombre}, 😊\n\nEspero que estés bien. Te contacto para hacer seguimiento a tu consulta sobre {producto}.\n\n¿Tienes alguna pregunta adicional? Me encantaría ayudarte a encontrar la mejor solución para tus necesidades.\n\n¡Quedo atento a tu respuesta!\n{vendedor}', 
            'ventas', 
            'seguimiento', 
            'Sistema'
        );
        
        const ejemplo3 = new Template(
            'Soporte Técnico', 
            'Hola {nombre}, 🔧\n\nHemos recibido tu consulta de soporte técnico sobre {issue}.\n\nNuestro equipo está trabajando en resolver tu problema. Te mantendremos informado sobre el progreso.\n\nTiempo estimado de resolución: {tiempo}\n\nGracias por tu paciencia.\nSoporte Técnico', 
            'soporte', 
            'tecnico', 
            'Sistema'
        );
        
        window.templateStore.agregarPlantilla(ejemplo1);
        window.templateStore.agregarPlantilla(ejemplo2);
        window.templateStore.agregarPlantilla(ejemplo3);
    }
    
    // ========== RENDERIZAR ESTADO INICIAL ==========
    renderPlantillas();
    actualizarEstadisticas();
    actualizarOpcionesHashtag();
    mostrarEstadisticasStorage();
    
    // Agregar botones adicionales
    setTimeout(() => {
        agregarBotonEliminarTodo();
        agregarBotonesImportExport();
        agregarEventListeners();
        inicializarPersistencia();
    }, 500);
    
    console.log('✅ Aplicación inicializada completamente');
});

// Agregar event listeners después de cada renderizado
// Esta función debe llamarse después de renderPlantillas()
function initEventListenersAfterRender() {
    agregarEventListeners();
}

// Modificar renderPlantillas para incluir event listeners
const originalRenderPlantillas = renderPlantillas;
renderPlantillas = function() {
    originalRenderPlantillas();
    setTimeout(() => {
        agregarEventListeners();
    }, 50);
};

// LAB 16 (HU3): Confirmación mejorada para eliminar plantilla
function confirmarEliminacionMejorada(titulo, callback) {
    // Crear modal de confirmación personalizado
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <div class="flex items-center gap-3 mb-4">
                <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                <h3 class="text-lg font-semibold text-gray-800">Confirmar Eliminación</h3>
            </div>
            
            <p class="text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar la plantilla 
                <strong>"${titulo}"</strong>?
            </p>
            
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <p class="text-yellow-800 text-sm">
                    <i class="fas fa-info-circle mr-1"></i>
                    Esta acción no se puede deshacer. La plantilla se eliminará permanentemente.
                </p>
            </div>
            
            <div class="flex gap-3 justify-end">
                <button id="cancel-delete" class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition duration-300">
                    <i class="fas fa-times mr-1"></i>
                    Cancelar
                </button>
                <button id="confirm-delete" class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition duration-300">
                    <i class="fas fa-trash mr-1"></i>
                    Eliminar Definitivamente
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Event listeners para los botones
    modal.querySelector('#cancel-delete').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    modal.querySelector('#confirm-delete').addEventListener('click', () => {
        callback(true);
        document.body.removeChild(modal);
    });
    
    // Cerrar con ESC o click fuera
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

