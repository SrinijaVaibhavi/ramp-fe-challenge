import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee, Transaction } from "./utils/types";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } = usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } = useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [isPaginationDataPresent, setIsPaginationDataPresent] = useState(true)
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]); 

  useEffect(() => {
    if (paginatedTransactions?.data) {
      setIsPaginationDataPresent(paginatedTransactions.nextPage === null ? false : true)
      setAllTransactions((prev) => [...prev, ...paginatedTransactions.data]);
    }
  }, [paginatedTransactions]);

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    await employeeUtils.fetchAll();
    setIsLoading(false);
    transactionsByEmployeeUtils.invalidateData(); 
    const newTransactions:any = await paginatedTransactionsUtils.fetchAll();
    if (newTransactions?.data) {
      setAllTransactions((prev) => [...prev, ...newTransactions.data]); 
    }
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);


  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  const loadTransactionsByEmployee = useCallback(async (employeeId: string) => {
    paginatedTransactionsUtils.invalidateData();
    await transactionsByEmployeeUtils.fetchById(employeeId);
  }, [paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={async (newValue) => {
            if (newValue === null || newValue.id === EMPTY_EMPLOYEE.id) {
              console.log("All Employees selected - Loading all transactions");
              await loadAllTransactions();
            } else {
              console.log("Employee selected:", newValue.firstName, newValue.lastName);
              await loadTransactionsByEmployee(newValue.id);
            }
          }}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions transactions={allTransactions} /> 

          {paginatedTransactions?.data?.length && paginatedTransactions?.data?.length > 0 && isPaginationDataPresent && (
            <button
              className="RampButton"
              disabled={paginatedTransactionsUtils.loading}
              onClick={async () => {
                await loadAllTransactions();
              }}
            >
              View More
            </button>
          )}
        </div>
      </main>
    </Fragment>
  );
}
