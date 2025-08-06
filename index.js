 const ORIGINAL_MECHANISMS = [
      "reflections",
      "auto LP", 
      "ponzi",
      "pump",
      "burn",
      "reaper",
      "gamble"
    ];

    const ADDITIONAL_MECHANISMS = [
      "staking rewards",
      "yield farming",
      "flash loans"
    ];

    const ALL_MECHANISMS = [...ORIGINAL_MECHANISMS, ...ADDITIONAL_MECHANISMS];

    const FUNKY_MESSAGES = [
      "🤡 Nice try, but that's not how ETH_OS works!",
      "💀 The reaper is not pleased with your selection...",
      "🎰 Wrong combo! The casino always wins!",
      "🔥 Burn it down and try again!",
      "💸 Your portfolio just got rekt!",
      "🦄 Even unicorns can't save this combination!",
      "⚡ Short circuit detected! Wrong mechanisms!",
      "🌪️ Chaos protocol activated! Try again!",
      "🎭 This isn't the degen way!",
      "🚀 Ansem, we have a problem!"
    ];

    // Game state
    let gameState = {
      selectedMechanisms: [],
      availableMechanisms: [...ALL_MECHANISMS],
      isComplete: false,
      moves: [],
      redoStack: []
    };

    // Touch handling for mobile
    let draggedElement = null;
    let touchOffset = { x: 0, y: 0 };

    // Create module tiles
    function createModules() {
      const container = document.getElementById('modules');
      container.innerHTML = '';
      
      gameState.availableMechanisms.forEach((mechanism, index) => {
        const div = document.createElement('div');
        div.className = 'module';
        div.dataset.mechanism = mechanism;
        
        const bg = document.createElement('div');
        bg.className = 'module-bg';
        
        const text = document.createElement('div');
        text.className = 'module-text';
        text.textContent = mechanism;
        
        div.appendChild(bg);
        div.appendChild(text);
        
        // Desktop drag events
        div.draggable = true;
        div.addEventListener('dragstart', (e) => {
          div.classList.add('dragging');
          e.dataTransfer.setData('text/plain', mechanism);
        });
        div.addEventListener('dragend', () => {
          div.classList.remove('dragging');
        });

        // Mobile touch events
        div.addEventListener('touchstart', handleTouchStart, { passive: false });
        div.addEventListener('touchmove', handleTouchMove, { passive: false });
        div.addEventListener('touchend', handleTouchEnd, { passive: false });
        
        container.appendChild(div);
      });
    }

    // Create assembly slots
    function createAssemblySlots() {
      const assembly = document.getElementById('assembly');
      assembly.innerHTML = '';
      
      for (let i = 0; i < 7; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.index = i;
        
        const bg = document.createElement('div');
        bg.className = 'slot-bg';
        
        const text = document.createElement('div');
        text.className = 'slot-text';
        text.textContent = `Slot ${i + 1}`;
        
        slot.appendChild(bg);
        slot.appendChild(text);

        // Desktop drag events
        slot.addEventListener('dragover', (e) => {
          e.preventDefault();
          slot.classList.add('drag-over');
        });

        slot.addEventListener('dragleave', () => {
          slot.classList.remove('drag-over');
        });

        slot.addEventListener('drop', (e) => {
          e.preventDefault();
          slot.classList.remove('drag-over');
          
          const mechanismName = e.dataTransfer.getData('text/plain');
          const dragging = document.querySelector(`[data-mechanism="${mechanismName}"]`);
          
          if (dragging && !slot.classList.contains('filled')) {
            fillSlot(slot, mechanismName, dragging);
          }
        });

        // Double-click to clear slot
        slot.addEventListener('dblclick', () => {
          if (slot.classList.contains('filled')) {
            clearSlot(slot);
          }
        });

        assembly.appendChild(slot);
      }
    }

    // Touch event handlers
    function handleTouchStart(e) {
      e.preventDefault();
      draggedElement = e.target.closest('.module');
      if (draggedElement) {
        draggedElement.classList.add('dragging');
        const touch = e.touches[0];
        const rect = draggedElement.getBoundingClientRect();
        touchOffset.x = touch.clientX - rect.left;
        touchOffset.y = touch.clientY - rect.top;
      }
    }

    function handleTouchMove(e) {
      e.preventDefault();
      if (draggedElement) {
        const touch = e.touches[0];
        draggedElement.style.position = 'fixed';
        draggedElement.style.left = (touch.clientX - touchOffset.x) + 'px';
        draggedElement.style.top = (touch.clientY - touchOffset.y) + 'px';
        draggedElement.style.zIndex = '1000';
        
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = elementBelow?.closest('.slot');
        
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
        if (slot && !slot.classList.contains('filled')) {
          slot.classList.add('drag-over');
        }
      }
    }

    function handleTouchEnd(e) {
      e.preventDefault();
      if (draggedElement) {
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const slot = elementBelow?.closest('.slot');
        
        if (slot && !slot.classList.contains('filled')) {
          const mechanismName = draggedElement.dataset.mechanism;
          fillSlot(slot, mechanismName, draggedElement);
        } else {
          draggedElement.style.position = '';
          draggedElement.style.left = '';
          draggedElement.style.top = '';
          draggedElement.style.zIndex = '';
        }
        
        draggedElement.classList.remove('dragging');
        document.querySelectorAll('.slot').forEach(s => s.classList.remove('drag-over'));
        draggedElement = null;
      }
    }

    // Fill a slot with a mechanism
    function fillSlot(slot, mechanismName, moduleElement) {
      gameState.moves.push({
        type: 'fill',
        slotIndex: parseInt(slot.dataset.index),
        mechanism: mechanismName
      });
      gameState.redoStack = [];
      
      slot.querySelector('.slot-text').textContent = mechanismName;
      slot.classList.add('filled');
      slot.dataset.mechanism = mechanismName;
      gameState.selectedMechanisms.push(mechanismName);
      
      gameState.availableMechanisms = gameState.availableMechanisms.filter(m => m !== mechanismName);
      moduleElement.remove();
      
      updateProgress();
      updateButtons();
      checkCompletion();
    }

    // Clear a slot
    function clearSlot(slot) {
      const mechanismName = slot.dataset.mechanism;
      if (!mechanismName) return;

      gameState.moves.push({
        type: 'clear',
        slotIndex: parseInt(slot.dataset.index),
        mechanism: mechanismName
      });
      gameState.redoStack = [];

      gameState.selectedMechanisms = gameState.selectedMechanisms.filter(m => m !== mechanismName);
      gameState.availableMechanisms.push(mechanismName);
      
      slot.classList.remove('filled');
      slot.dataset.mechanism = '';
      slot.querySelector('.slot-text').textContent = `Slot ${parseInt(slot.dataset.index) + 1}`;
      
      createModules();
      updateProgress();
      updateButtons();
      checkCompletion();
    }

    // Update progress bar
    function updateProgress() {
      const progress = (gameState.selectedMechanisms.length / 7) * 100;
      document.getElementById('progress').style.width = progress + '%';
    }

    // Update button states
    function updateButtons() {
      document.getElementById('undoBtn').disabled = gameState.moves.length === 0;
      document.getElementById('redoBtn').disabled = gameState.redoStack.length === 0;
    }

    // Undo last move
    function undoLastMove() {
      if (gameState.moves.length === 0) return;
      
      const lastMove = gameState.moves.pop();
      gameState.redoStack.push(lastMove);
      
      const slot = document.querySelector(`[data-index="${lastMove.slotIndex}"]`);
      
      if (lastMove.type === 'fill') {
        gameState.selectedMechanisms = gameState.selectedMechanisms.filter(m => m !== lastMove.mechanism);
        gameState.availableMechanisms.push(lastMove.mechanism);
        
        slot.classList.remove('filled');
        slot.dataset.mechanism = '';
        slot.querySelector('.slot-text').textContent = `Slot ${lastMove.slotIndex + 1}`;
        
        createModules();
      } else if (lastMove.type === 'clear') {
        gameState.selectedMechanisms.push(lastMove.mechanism);
        gameState.availableMechanisms = gameState.availableMechanisms.filter(m => m !== lastMove.mechanism);
        
        slot.classList.add('filled');
        slot.dataset.mechanism = lastMove.mechanism;
        slot.querySelector('.slot-text').textContent = lastMove.mechanism;
        
        createModules();
      }
      
      updateProgress();
      updateButtons();
      checkCompletion();
    }

    // Redo last undone move
    function redoLastMove() {
      if (gameState.redoStack.length === 0) return;
      
      const moveToRedo = gameState.redoStack.pop();
      gameState.moves.push(moveToRedo);
      
      const slot = document.querySelector(`[data-index="${moveToRedo.slotIndex}"]`);
      
      if (moveToRedo.type === 'fill') {
        gameState.selectedMechanisms.push(moveToRedo.mechanism);
        gameState.availableMechanisms = gameState.availableMechanisms.filter(m => m !== moveToRedo.mechanism);
        
        slot.classList.add('filled');
        slot.dataset.mechanism = moveToRedo.mechanism;
        slot.querySelector('.slot-text').textContent = moveToRedo.mechanism;
        
        createModules();
      } else if (moveToRedo.type === 'clear') {
        gameState.selectedMechanisms = gameState.selectedMechanisms.filter(m => m !== moveToRedo.mechanism);
        gameState.availableMechanisms.push(moveToRedo.mechanism);

        slot.classList.remove('filled');
        slot.dataset.mechanism = '';
        slot.querySelector('.slot-text').textContent = `Slot ${moveToRedo.slotIndex + 1}`;
        
        createModules();
      }
      
      updateProgress();
      updateButtons();
      checkCompletion();
    }

    // Check if game is complete
    function checkCompletion() {
      const statusMessage = document.getElementById('statusMessage');
      const flywheel = document.getElementById('flywheel');
      
      if (gameState.selectedMechanisms.length === 7) {
        const isCorrect = gameState.selectedMechanisms.every(mechanism => 
          ORIGINAL_MECHANISMS.includes(mechanism)
        );
        
        if (isCorrect) {
          gameState.isComplete = true;
          flywheel.classList.add('spinning');
          statusMessage.textContent = '🎉 FLYWHEEL ACTIVATED! The original 7 mechanisms are assembled!';
          statusMessage.className = 'status-message status-success';
        } else {
          showFunkyMessage();
          flywheel.classList.remove('spinning');
          statusMessage.textContent = '💀 Wrong combination! The flywheel rejects your assembly...';
          statusMessage.className = 'status-message status-error';
        }
      } else {
        flywheel.classList.remove('spinning');
        statusMessage.textContent = `Awaiting assembly... (${gameState.selectedMechanisms.length}/7)`;
        statusMessage.className = 'status-message';
      }
    }

    // Show funky error message
    function showFunkyMessage() {
      const funkyDiv = document.getElementById('funkyMessage');
      const randomMessage = FUNKY_MESSAGES[Math.floor(Math.random() * FUNKY_MESSAGES.length)];
      
      funkyDiv.textContent = randomMessage;
      funkyDiv.style.display = 'block';
      
      setTimeout(() => {
        funkyDiv.style.display = 'none';
      }, 3000);
    }

    // Randomize module order
    function randomizeModules() {
      gameState.availableMechanisms = [...ALL_MECHANISMS].sort(() => Math.random() - 0.5);
      createModules();
    }

    // Reveal the answer
    function revealAnswer() {
      const statusMessage = document.getElementById('statusMessage');
      statusMessage.innerHTML = `
        🔍 <strong>The Original 7:</strong><br>
        ${ORIGINAL_MECHANISMS.join(' • ')}
      `;
      statusMessage.className = 'status-message status-success';
      
      setTimeout(() => {
        statusMessage.textContent = 'Awaiting assembly...';
        statusMessage.className = 'status-message';
      }, 5000);
    }

    // Reset the game
    function resetExperiment() {
      gameState = {
        selectedMechanisms: [],
        availableMechanisms: [...ALL_MECHANISMS].sort(() => Math.random() - 0.5),
        isComplete: false,
        moves: [],
        redoStack: []
      };
      
      createModules();
      createAssemblySlots();
      
      document.getElementById('statusMessage').textContent = 'Awaiting assembly...';
      document.getElementById('statusMessage').className = 'status-message';
      document.getElementById('progress').style.width = '0%';
      document.getElementById('flywheel').classList.remove('spinning');
      
      updateButtons();
    }

    // Background upload functionality
    function setupBackgroundUpload() {
      const imageInput = document.createElement('input');
      imageInput.type = 'file';
      imageInput.accept = 'image/*';
      imageInput.style.display = 'none';
      imageInput.id = 'bgUpload';
      imageInput.onchange = handleBackgroundUpload;
      document.body.appendChild(imageInput);
      
      document.addEventListener('dblclick', (e) => {
        if (e.target === document.body || e.target.classList.contains('bg-overlay')) {
          document.getElementById('bgUpload').click();
        }
      });
    }

    function handleBackgroundUpload(event) {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          document.getElementById('bgOverlay').style.backgroundImage = `url(${e.target.result})`;
          document.getElementById('bgOverlay').style.opacity = '0.2';
        };
        reader.readAsDataURL(file);
      }
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'r' && e.ctrlKey) {
        e.preventDefault();
        resetExperiment();
      }
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault();
        randomizeModules();
      }
      if (e.key === 'z' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        undoLastMove();
      }
      if (e.key === 'z' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        redoLastMove();
      }
      if (e.key === 'y' && e.ctrlKey) {
        e.preventDefault();
        redoLastMove();
      }
    });

    // Create floating elements
    function createFloatingElements() {
      const container = document.body;
      for (let i = 0; i < 15; i++) {
        const element = document.createElement('div');
        element.style.cssText = `
          position: fixed;
          width: 4px;
          height: 4px;
          background: rgba(0, 255, 136, 0.3);
          border-radius: 50%;
          pointer-events: none;
          z-index: -1;
          left: ${Math.random() * 100}%;
          top: ${Math.random() * 100}%;
          animation: float ${5 + Math.random() * 10}s infinite linear;
        `;
        container.appendChild(element);
      }
    }

    // Konami code easter egg
    let konamiCode = [];
    const konami = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65];
    document.addEventListener('keydown', (e) => {
      konamiCode.push(e.keyCode);
      if (konamiCode.length > 10) konamiCode.shift();
      
      if (JSON.stringify(konamiCode) === JSON.stringify(konami)) {
        resetExperiment();
        
        setTimeout(() => {
          const slots = document.querySelectorAll('.slot');
          ORIGINAL_MECHANISMS.forEach((mechanism, index) => {
            const moduleElement = document.querySelector(`[data-mechanism="${mechanism}"]`);
            if (moduleElement && slots[index]) {
              fillSlot(slots[index], mechanism, moduleElement);
            }
          });
          
          document.body.style.animation = 'rainbow 3s infinite';
          const rainbowStyle = document.createElement('style');
          rainbowStyle.textContent = `
            @keyframes rainbow {
              0% { filter: hue-rotate(0deg); }
              100% { filter: hue-rotate(360deg); }
            }
          `;
          document.head.appendChild(rainbowStyle);
          
          setTimeout(() => {
            document.body.style.animation = '';
          }, 5000);
          
          const message = document.createElement('div');
          message.innerHTML = '🎉 <strong>AI ACTIVATED!</strong><br>🚀 Auto-solved with original 7!';
          message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.95);
            color: black;
            padding: 25px;
            border-radius: 12px;
            font-weight: bold;
            z-index: 10000;
            text-align: center;
            animation: pulse 1s infinite;
            box-shadow: 0 0 50px rgba(0, 255, 136, 0.8);
          `;
          document.body.appendChild(message);
          
          const pulseStyle = document.createElement('style');
          pulseStyle.textContent = `
            @keyframes pulse {
              0% { transform: translate(-50%, -50%) scale(1); }
              50% { transform: translate(-50%, -50%) scale(1.05); }
              100% { transform: translate(-50%, -50%) scale(1); }
            }
          `;
          document.head.appendChild(pulseStyle);
          
          setTimeout(() => message.remove(), 4000);
        }, 500);
      }
    });

    // Initialize the game
    function initGame() {
      setupBackgroundUpload();
      createFloatingElements();
      resetExperiment();
      
      // Add help tooltip
      const tooltip = document.createElement('div');
      tooltip.innerHTML = `
        <strong>💡 How to play?</strong><br>
        • Double-click filled slots to clear them<br>
        • Ctrl+Z: Undo | Ctrl+Y: Redo | Ctrl+R: Reset<br>
        • Find the original 7 mechanisms to spin the flywheel! 🎯<br>
        • Try the AI for instant solution! 🎮
      `;
      tooltip.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.9);
        color: whitesmoke;
        padding: 15px;
        border-radius: 10px;
        font-size: 12px;
        max-width: 280px;
        z-index: 1000;
        border: 1px solid rgba(0, 255, 136, 0.3);
        backdrop-filter: blur(10px);
      `;
      document.body.appendChild(tooltip);
      
      setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transition = 'opacity 1s';
        setTimeout(() => tooltip.remove(), 1000);
      }, 6000);
    }

    // Start the game when page loads
    document.addEventListener('DOMContentLoaded', initGame);
    
    // Fallback initialization
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initGame);
    } else {
      initGame();
    }