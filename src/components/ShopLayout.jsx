import { useGameState } from '../contexts/GameStateContext';
// Removed useDrop as it's not used here
import Shelf from './Shelf';
import Inventory from './Inventory';
import DialoguePanel from './DialoguePanel';
import Controls from './Controls';
import MarketPanel from './MarketPanel'; // Import the new MarketPanel
import styles from './ShopLayout.module.css'; // Import CSS Module

// Removed COLORS and UI_PADDING import

export default function ShopLayout() {
  const { state } = useGameState();

  // Helper function to determine loan info class
  const getLoanInfoClass = () => {
    const baseClass = styles.loanInfo; // Assuming a base class if needed, otherwise just conditional
    return state.day >= state.loanDueDate ? `${baseClass} ${styles.loanInfoDanger}` : baseClass;
  };

  return (
    <div className={styles.shopLayout}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <span>Day {state.day}</span>
        {/* Spacer element */}
        <span></span>
        {/* Reputation Display */}
        <span>Rep: {state.reputation}</span>
        {/* Loan Due Date & Amount Display */}
        <span className={getLoanInfoClass()}>
          Loan: {state.loanAmount}g / {state.totalLoanOwed}g (Due Day {state.loanDueDate})
        </span>
        {/* Gold Display */}
        <span className={styles.goldInfo}>{state.gold}g</span>
      </div>

      {/* Phase-Specific Layouts - Now direct children of phaseContainer grid */}
      {state.phase === 'management' && (
        // Apply phaseContainer class which is the grid parent
        <div className={styles.phaseContainer}> 
          {/* Grid Item 1: Top Row Content */}
          <div className={styles.managementTop}> 
            <MarketPanel className={styles.panel} /> {/* Removed panelScrollable */}
          </div>
          {/* Grid Item 2: Bottom Row Content */}
          <div className={styles.managementBottom}> 
            <div className={styles.managementBottomInventory}>
              <Inventory className={styles.panel} /> {/* Removed panelScrollable */}
            </div>
            <div className={styles.managementBottomControls}>
              {/* Pass panel styles to Controls */}
              <Controls className={styles.panel} />
            </div>
          </div>
        </div>
      )}

       {state.phase === 'setting up' && (
          // Apply phaseContainer class which is the grid parent
          <div className={styles.phaseContainer}>
            {/* Grid Item 1: Top Row Content */}
            <div className={styles.settingUpTop}> 
              <Shelf className={styles.panel} />
            </div>
            {/* Grid Item 2: Bottom Row Content */}
            <div className={styles.settingUpBottom}> 
              <div className={styles.settingUpBottomInventory}>
                <Inventory className={styles.panel} /> {/* Removed panelScrollable */}
              </div>
              {/* Wrap Controls (takes its natural width) */}
              <div className={styles.settingUpBottomControls}>
                {/* Pass panel styles to Controls */}
                <Controls className={styles.panel} />
              </div>
            </div>
          </div>
      )}

       {state.phase === 'selling' && (
        // Apply phaseContainer class which is the grid parent
       <div className={styles.phaseContainer}>
         {/* Grid Item 1: Top Row Content (Shelf Left, Dialogue Right) */}
         <div className={styles.sellingTopRow}> 
           <div className={styles.sellingShelfWrapper}>
             <Shelf className={styles.panel} />
           </div>
           <div className={styles.sellingDialogueWrapper}>
             <DialoguePanel className={styles.panel} /> 
           </div>
         </div>
         {/* Grid Item 2: Bottom Row Content (Inventory Left, Controls Right) */}
         <div className={styles.sellingBottomRow}> 
           <div className={styles.sellingInventoryWrapper}>
             <Inventory className={styles.panel} /> 
           </div>
           <div className={styles.sellingControlsWrapper}>
             <Controls className={styles.panel} />
           </div>
         </div>
       </div>
      )}

    </div>
  );
}
