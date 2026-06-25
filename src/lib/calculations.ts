import type { CalculatedDailyLine, EditableDailyLine } from '../types/domain'

export function calculateLine(line: EditableDailyLine): CalculatedDailyLine {
  const warehouseStockAfter = line.warehouseStockBefore + line.supplierEntry - line.takenFromWarehouse
  const breakfastAvailable = line.initialLeftover + line.takenFromWarehouse
  const breakfastConsumed = breakfastAvailable - line.finalLeftover

  let error: string | undefined

  if (line.takenFromWarehouse > line.warehouseStockBefore + line.supplierEntry) {
    error = 'No puedes sacar mas pan del stock disponible.'
  } else if (line.finalLeftover > breakfastAvailable) {
    error = 'El resto final no puede ser mayor que el disponible.'
  } else if (breakfastConsumed < 0) {
    error = 'El consumo no puede ser negativo.'
  }

  return {
    ...line,
    warehouseStockAfter,
    breakfastAvailable,
    breakfastConsumed,
    error,
  }
}
