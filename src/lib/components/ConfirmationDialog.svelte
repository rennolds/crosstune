<script>
    let { 
      isOpen = false, 
      title = '', 
      message = '', 
      confirmText = 'Confirm', 
      cancelText = 'Cancel',
      onConfirm = () => {},
      onCancel = () => {}
    } = $props();
  
    function handleConfirm() {
      onConfirm();
    }
  
    function handleCancel() {
      onCancel();
    }
  </script>
  
  {#if isOpen}
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Dialog itself - centered with clean design -->
      <div class="bg-white rounded-lg p-6 max-w-sm w-full shadow-lg border border-gray-200">
        {#if title}
          <h3 class="text-lg font-medium text-center mb-2">{title}</h3>
        {/if}
        
        <p class="text-center dark:text-black mb-6">{message}</p>
        
        <div class="flex justify-center space-x-6">
          <button 
            class="px-4 py-2 text-gray-700 font-medium hover:bg-gray-100 rounded" 
            onclick={handleCancel}
          >
            {cancelText}
          </button>
          
          <button 
            class="px-4 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded" 
            onclick={handleConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  {/if}