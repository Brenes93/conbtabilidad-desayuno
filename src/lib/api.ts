import { supabase } from './supabase'
import { calculateLine } from './calculations'
import type { CalculatedDailyLine, DailyLine, DailyRecord, EditableDailyLine, HistoryRecord, Product } from '../types/domain'

export async function getProducts(includeInactive = false) {
  let query = supabase.from('products').select('*').order('sort_order', { ascending: true }).order('name')

  if (!includeInactive) {
    query = query.eq('active', true)
  }

  const { data, error } = await query
  if (error) throw error
  return data as Product[]
}

export async function saveProduct(input: { id?: string; name: string; active?: boolean; sort_order: number }) {
  const payload = {
    name: input.name.trim(),
    active: input.active ?? true,
    sort_order: input.sort_order,
  }

  const query = input.id
    ? supabase.from('products').update(payload).eq('id', input.id).select().single()
    : supabase.from('products').insert(payload).select().single()

  const { data, error } = await query
  if (error) throw error
  return data as Product
}

export async function setProductActive(id: string, active: boolean) {
  const { error } = await supabase.from('products').update({ active }).eq('id', id)
  if (error) throw error
}

export async function getOrCreateDailyRecord(recordDate: string) {
  const { data: existing, error: findError } = await supabase
    .from('daily_breakfast_records')
    .select('*')
    .eq('record_date', recordDate)
    .maybeSingle()

  if (findError) throw findError
  if (existing) return existing as DailyRecord

  const { data, error } = await supabase
    .from('daily_breakfast_records')
    .insert({ record_date: recordDate })
    .select()
    .single()

  if (error) throw error
  return data as DailyRecord
}

export async function getWarehouseStocksBefore(recordDate: string, productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>()

  const { data, error } = await supabase
    .from('warehouse_movements')
    .select('product_id, movement_date, type, quantity')
    .in('product_id', productIds)
    .lte('movement_date', recordDate)

  if (error) throw error

  const stocks = new Map<string, number>()

  for (const productId of productIds) {
    stocks.set(productId, 0)
  }

  for (const movement of data ?? []) {
    const isPreviousDay = movement.movement_date < recordDate
    const isSameDayManualAdjustment = movement.movement_date === recordDate && movement.type === 'manual_adjustment'

    if (isPreviousDay || isSameDayManualAdjustment) {
      stocks.set(movement.product_id, (stocks.get(movement.product_id) ?? 0) + Number(movement.quantity))
    }
  }

  return stocks
}

export async function getInitialLeftovers(recordDate: string, productIds: string[]) {
  if (productIds.length === 0) return new Map<string, number>()

  const { data, error } = await supabase
    .from('daily_breakfast_lines')
    .select('product_id, final_leftover, daily_breakfast_records!inner(record_date)')
    .in('product_id', productIds)
    .lt('daily_breakfast_records.record_date', recordDate)
    .order('record_date', { referencedTable: 'daily_breakfast_records', ascending: false })

  if (error) throw error
  const leftovers = new Map<string, number>()
  const seen = new Set<string>()

  for (const productId of productIds) {
    leftovers.set(productId, 0)
  }

  for (const line of data ?? []) {
    if (!seen.has(line.product_id)) {
      leftovers.set(line.product_id, Number(line.final_leftover))
      seen.add(line.product_id)
    }
  }

  return leftovers
}

export async function getDailyLines(recordId: string) {
  const { data, error } = await supabase.from('daily_breakfast_lines').select('*').eq('daily_record_id', recordId)
  if (error) throw error
  return data as DailyLine[]
}

export async function loadDailyEditor(recordDate: string) {
  const [products, record] = await Promise.all([getProducts(), getOrCreateDailyRecord(recordDate)])
  const productIds = products.map((product) => product.id)
  const [stocks, leftovers, savedLines] = await Promise.all([
    getWarehouseStocksBefore(recordDate, productIds),
    getInitialLeftovers(recordDate, productIds),
    getDailyLines(record.id),
  ])
  const savedByProduct = new Map(savedLines.map((line) => [line.product_id, line]))

  const lines = products.map((product): EditableDailyLine => {
    const savedLine = savedByProduct.get(product.id)

    return {
      product,
      savedLine,
      warehouseStockBefore: stocks.get(product.id) ?? 0,
      supplierEntry: savedLine?.supplier_entry ?? 0,
      takenFromWarehouse: savedLine?.taken_from_warehouse ?? 0,
      initialLeftover: leftovers.get(product.id) ?? 0,
      finalLeftover: savedLine?.final_leftover ?? 0,
    }
  })

  return { record, lines }
}

export async function saveDailyRecord(input: {
  record: DailyRecord
  breakfastTotal: number
  closed: boolean
  lines: CalculatedDailyLine[]
}) {
  const invalidLine = input.lines.find((line) => line.error)
  if (invalidLine) throw new Error(`${invalidLine.product.name}: ${invalidLine.error}`)

  const existingLines = await getDailyLines(input.record.id)
  const existingByProduct = new Map(existingLines.map((line) => [line.product_id, line]))

  const { error: recordError } = await supabase
    .from('daily_breakfast_records')
    .update({ breakfast_total: input.breakfastTotal, closed: input.closed, updated_at: new Date().toISOString() })
    .eq('id', input.record.id)

  if (recordError) throw recordError

  for (const line of input.lines) {
    const payload = {
      daily_record_id: input.record.id,
      product_id: line.product.id,
      warehouse_stock_before: line.warehouseStockBefore,
      supplier_entry: line.supplierEntry,
      taken_from_warehouse: line.takenFromWarehouse,
      warehouse_stock_after: line.warehouseStockAfter,
      initial_leftover: line.initialLeftover,
      breakfast_available: line.breakfastAvailable,
      final_leftover: line.finalLeftover,
      breakfast_consumed: line.breakfastConsumed,
      updated_at: new Date().toISOString(),
    }

    const { error: lineError } = await supabase
      .from('daily_breakfast_lines')
      .upsert(payload, { onConflict: 'daily_record_id,product_id' })

    if (lineError) throw lineError

    const existingLine = existingByProduct.get(line.product.id)
    const previousSupplier = existingLine?.supplier_entry ?? 0
    const previousTaken = existingLine?.taken_from_warehouse ?? 0
    const supplierDelta = line.supplierEntry - previousSupplier
    const takenDelta = line.takenFromWarehouse - previousTaken

    if (supplierDelta !== 0) {
      const { error } = await supabase.from('warehouse_movements').insert({
        product_id: line.product.id,
        movement_date: input.record.record_date,
        type: 'supplier_entry',
        quantity: supplierDelta,
        notes: 'Entrada proveedor registrada desde diario',
      })
      if (error) throw error
    }

    if (takenDelta !== 0) {
      const { error } = await supabase.from('warehouse_movements').insert({
        product_id: line.product.id,
        movement_date: input.record.record_date,
        type: 'breakfast_out',
        quantity: -takenDelta,
        notes: 'Sacado para desayuno registrado desde diario',
      })
      if (error) throw error
    }
  }
}

export async function saveManualAdjustment(input: { productId: string; date: string; quantity: number; notes: string }) {
  if (input.quantity === 0) throw new Error('El ajuste no puede ser 0.')

  const { error } = await supabase.from('warehouse_movements').insert({
    product_id: input.productId,
    movement_date: input.date,
    type: 'manual_adjustment',
    quantity: input.quantity,
    notes: input.notes.trim() || 'Movimiento manual de almacen',
  })

  if (error) throw error
}

export async function getHistory(limit = 20) {
  const { data, error } = await supabase
    .from('daily_breakfast_records')
    .select('*, daily_breakfast_lines(*, products(name, sort_order))')
    .order('record_date', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as HistoryRecord[]
}

export function calculateLines(lines: EditableDailyLine[]) {
  return lines.map(calculateLine)
}
