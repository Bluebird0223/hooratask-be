class BalanceCalculator {
  // Calculate net balances for all users
  static calculateNetBalances(expenses) {
    const balances = new Map();

    expenses.forEach(expense => {
      const { payer, participants, totalAmount } = expense;
      
      // Initialize payer balance
      if (!balances.has(payer.toString())) {
        balances.set(payer.toString(), 0);
      }
      
      // Payer paid the total amount
      balances.set(payer.toString(), 
        balances.get(payer.toString()) + totalAmount);
      
      // Each participant owes their share
      participants.forEach(participant => {
        const userId = participant.user.toString();
        const amountOwed = participant.amount;
        
        if (!balances.has(userId)) {
          balances.set(userId, 0);
        }
        
        balances.set(userId, 
          balances.get(userId) - amountOwed);
      });
    });
    
    return balances;
  }
  
  // settlements to minimize transactions
  static optimizeSettlements(balances) {
    const debtors = [];
    const creditors = [];
    
    // Separate debtors and creditors
    for (const [userId, balance] of balances.entries()) {
      if (Math.abs(balance) < 0.01) continue;
      
      if (balance < 0) {
        debtors.push({ userId, amount: Math.abs(balance) });
      } else if (balance > 0) {
        creditors.push({ userId, amount: balance });
      }
    }
    
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    const settlements = [];
    let i = 0, j = 0;
    
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);
      
      if (amount > 0) {
        settlements.push({
          from: debtor.userId,
          to: creditor.userId,
          amount: parseFloat(amount.toFixed(2))
        });
      }
      
      debtor.amount -= amount;
      creditor.amount -= amount;
      
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    
    return settlements;
  }
  
  static calculateBalancesRaw(balances) {
    const debts = [];
    
    for (const [userId, balance] of balances.entries()) {
      if (balance < 0) {
        debts.push({
          user: userId,
          owes: Math.abs(balance)
        });
      }
    }
    
    return debts;
  }
  
  // Generate readable balance statements
  static generateBalanceStatements(balances, usersMap) {
    const statements = [];
    
    for (const [userId, balance] of balances.entries()) {
      const userName = usersMap.get(userId) || userId;
      if (Math.abs(balance) > 0.01) {
        statements.push({
          user: userName,
          balance: parseFloat(balance.toFixed(2)),
          status: balance > 0 ? 'is owed' : 'owes',
          amount: parseFloat(Math.abs(balance).toFixed(2))
        });
      }
    }
    
    return statements;
  }
}

module.exports = BalanceCalculator;