export type Service = 'packing' | 'disassembly' | 'assembly';

export interface Item {
  id: string;
  name: string;
  quantity: number | null;
  notes: string;
  services: Record<Service, boolean>;
}

export interface Room {
  id: string;
  name: string;
  items: Item[];
}

export interface Address {
  city: string;
  district: string;
}

export interface Order {
  origin: Address;
  destination: Address;
  date: string;
  flexibleDate: boolean;
  accessNotes: string;
  rooms: Room[];
}

export type Step = 0 | 1 | 2;

export const serviceOptions = [
  { id: 'packing', label: 'Embalagem', icon: 'package' },
  { id: 'disassembly', label: 'Desmontagem na origem', icon: 'wrench' },
  { id: 'assembly', label: 'Montagem no destino', icon: 'hammer' },
] as const;

export const addressOptions = [
  { id: 'origin', label: 'Origem' },
  { id: 'destination', label: 'Destino' },
] as const;

let nextId = 0;
export const makeId = () => String(++nextId);

export function emptyOrder(): Order {
  return {
    origin: { city: '', district: '' },
    destination: { city: '', district: '' },
    date: '',
    flexibleDate: false,
    accessNotes: '',
    rooms: [],
  };
}

export function newItem(name = '', quantity = 1, services: Service[] = [], notes = ''): Item {
  return {
    id: makeId(), name, quantity, notes,
    services: {
      packing: services.includes('packing'),
      disassembly: services.includes('disassembly'),
      assembly: services.includes('assembly'),
    },
  };
}

export function exampleOrder(): Order {
  return {
    ...emptyOrder(),
    origin: { city: 'Curitiba', district: 'Água Verde' },
    destination: { city: 'Curitiba', district: 'Cabral' },
    flexibleDate: true,
    rooms: [
      { id: makeId(), name: 'Sala', items: [
        newItem('Sofá de três lugares'),
        newItem('TV de 55 polegadas', 1, ['packing']),
      ] },
      { id: makeId(), name: 'Quarto', items: [newItem('Guarda-roupa', 1, ['disassembly', 'assembly'])] },
      { id: makeId(), name: 'Cozinha', items: [newItem('Caixa de louça', 2, ['packing'], 'Frágil')] },
    ],
  };
}

export function validQuantity(value: number | null): value is number {
  return value !== null && Number.isSafeInteger(value) && value > 0;
}

export function validItem(item: Item) {
  return Boolean(item.name.trim()) && validQuantity(item.quantity);
}

export function validate(order: Order) {
  const details: Record<string, string> = {};
  const inventory: Record<string, string> = {};
  for (const { id } of addressOptions) {
    if (!order[id].city.trim()) details[id + '-city'] = 'Informe a cidade.';
    if (!order[id].district.trim()) details[id + '-district'] = 'Informe o bairro.';
  }
  if (!order.flexibleDate && !order.date) details['move-date'] = 'Informe a data ou marque “Data a combinar”.';

  if (!order.rooms.some((room) => room.items.some(validItem))) {
    inventory['items'] = 'Adicione pelo menos um item com nome e quantidade válida.';
  }

  for (const room of order.rooms) {
    if (!room.name.trim()) inventory['room-' + room.id] = 'Informe o nome do cômodo.';
    for (const item of room.items) {
      if (!item.name.trim()) inventory['item-' + item.id] = 'Informe o nome do item.';
      if (!validQuantity(item.quantity)) inventory['qty-' + item.id] = 'Use um número inteiro maior que zero.';
    }
  }
  return { details, inventory };
}

export function formatAddress(address: Address) {
  return [address.district.trim(), address.city.trim()].filter(Boolean).join(', ');
}

export function formatDate(order: Order) {
  return order.flexibleDate ? 'Data a combinar' : order.date.split('-').reverse().join('/');
}

export function selectedServices(item: Item) {
  return serviceOptions.filter(({ id }) => item.services[id]);
}

export function filledRooms(order: Order) {
  return order.rooms.filter((room) => room.items.length > 0);
}

export function roomIcon(name: string) {
  switch (name.trim().toLocaleLowerCase('pt-BR')) {
    case 'sala': return 'sofa';
    case 'quarto': return 'bed';
    case 'cozinha': return 'utensils';
    default: return 'home';
  }
}

export function orderSummary(order: Order) {
  return [
    'Alta Performance Mudanças — Ficha de demonstração',
    'Origem: ' + formatAddress(order.origin),
    'Destino: ' + formatAddress(order.destination),
    'Data: ' + formatDate(order),
    'Observações de acesso: ' + (order.accessNotes.trim() || 'Não informadas'),
    ...filledRooms(order).flatMap((room) => [
      '',
      room.name.trim(),
      ...room.items.map((item) => {
        const services = selectedServices(item).map(({ label }) => label).join(', ') || 'Só transporte';
        const notes = item.notes.trim();
        return '- ' + item.quantity + ' × ' + item.name.trim() + ' — ' + services + (notes ? ' | ' + notes : '');
      }),
    ]),
  ].join('\n');
}
