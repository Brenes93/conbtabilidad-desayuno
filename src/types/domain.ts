export type Product = {
  id: string
  name: string
  active: boolean
  sort_order: number
  created_at: string
}

export type MovementType = 'supplier_entry' | 'breakfast_out' | 'manual_adjustment'

export type DailyRecord = {
  id: string
  record_date: string
  breakfast_total: number
  closed: boolean
  created_at: string
  updated_at: string
}

export type DailyLine = {
  id: string
  daily_record_id: string
  product_id: string
  warehouse_stock_before: number
  supplier_entry: number
  taken_from_warehouse: number
  warehouse_stock_after: number
  initial_leftover: number
  breakfast_available: number
  final_leftover: number
  breakfast_consumed: number
  created_at: string
  updated_at: string
}

export type EditableDailyLine = {
  product: Product
  savedLine?: DailyLine
  warehouseStockBefore: number
  supplierEntry: number
  takenFromWarehouse: number
  initialLeftover: number
  finalLeftover: number
}

export type CalculatedDailyLine = EditableDailyLine & {
  warehouseStockAfter: number
  breakfastAvailable: number
  breakfastConsumed: number
  error?: string
}

export type HistoryRecord = DailyRecord & {
  daily_breakfast_lines: Array<DailyLine & { products: Pick<Product, 'name' | 'sort_order'> | null }>
}
