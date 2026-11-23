import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  addressOptions, emptyOrder, exampleOrder, filledRooms, formatAddress, formatDate,
  makeId, newItem, roomIcon, selectedServices, serviceOptions, validItem, validate,
  type Item, type Order, type Room, type Step,
} from '../shared/order.js';

export interface MoveFormProps {
  order: Order;
  step: Step;
  onChange: (order: Order) => void;
  onStepChange: (step: Step) => void;
  onConfirm: (order: Order) => void;
}

const steps = ['Dados da mudança', 'Itens por cômodo', 'Revisão'] as const;
const introductions = [
  'Informe de onde e para onde você vai e quando pretende se mudar.',
  'Organize o que vai levar e marque os serviços de cada item.',
  'Confira o trajeto, os itens e os serviços antes de gerar a ficha para a equipe.',
] as const;

function Icon({ name }: { name: string }) {
  return <svg className="icon" aria-hidden="true"><use href={'icons.svg#' + name} /></svg>;
}

function Field({ id, label, error, optional, children }: {
  id: string; label: string; error?: string; optional?: boolean; children: ReactNode;
}) {
  return <div className="min-w-0">
    <label className="field-label" htmlFor={id}>{label}{optional && <span> · opcional</span>}</label>
    {children}
    {error && <p id={id + '-error'} className="field-error">{error}</p>}
  </div>;
}

function errorAttrs(id: string, error?: string) {
  return error ? { 'aria-invalid': true as const, 'aria-describedby': id + '-error' } : {};
}

function Checkmark() {
  return <span className="tick"><Icon name="check" /></span>;
}

function Details({ order, change, errors }: { order: Order; change: MoveFormProps['onChange']; errors: Record<string, string> }) {
  return <div className="divide-y divide-line">
    {addressOptions.map(({ id, label }) => <section className="form-section" key={id} aria-labelledby={id + '-heading'}>
      <h3 id={id + '-heading'} className="section-title"><span className="icon-tile"><Icon name={id === 'origin' ? 'pin' : 'flag'} /></span>{label}</h3>
      <div className="field-pair">
        {(['city', 'district'] as const).map((field) => {
          const fieldId = id + '-' + field;
          return <Field key={field} id={fieldId} label={field === 'city' ? 'Cidade' : 'Bairro'} error={errors[fieldId]}>
            <input id={fieldId} value={order[id][field]} required
              placeholder={field === 'city' ? 'Ex.: Curitiba' : id === 'origin' ? 'Ex.: Água Verde' : 'Ex.: Cabral'}
              {...errorAttrs(fieldId, errors[fieldId])}
              onChange={(event) => change({ ...order, [id]: { ...order[id], [field]: event.target.value } })} />
          </Field>;
        })}
      </div>
    </section>)}
    <section className="form-section" aria-labelledby="date-heading">
      <h3 id="date-heading" className="section-title"><span className="icon-tile"><Icon name="calendar" /></span>Quando?</h3>
      <div className="date-grid">
        <Field id="move-date" label="Data prevista" error={errors['move-date']}>
          <input id="move-date" type="date" value={order.date} disabled={order.flexibleDate} required={!order.flexibleDate}
            {...errorAttrs('move-date', errors['move-date'])}
            onChange={(event) => change({ ...order, date: event.target.value })} />
        </Field>
        <label className="check-control date-check">
          <input type="checkbox" checked={order.flexibleDate}
            onChange={(event) => change({ ...order, flexibleDate: event.target.checked })} />
          <Checkmark />Data a combinar
        </label>
      </div>
    </section>
    <section className="form-section">
      <Field id="access" label="Observações de acesso" optional>
        <textarea id="access" rows={2} placeholder="Ex.: 3º andar na origem, com elevador no destino."
          value={order.accessNotes} onChange={(event) => change({ ...order, accessNotes: event.target.value })} />
      </Field>
    </section>
  </div>;
}

function ItemEditor({ item, number, update, remove, errors }: {
  item: Item; number: number; update: (patch: Partial<Item>) => void; remove: () => void; errors: Record<string, string>;
}) {
  const nameId = 'item-' + item.id;
  const qtyId = 'qty-' + item.id;
  const notesId = 'notes-' + item.id;
  return <article className="item-editor" aria-labelledby={'item-title-' + item.id}>
    <div className="flex items-center justify-between gap-2">
      <h4 id={'item-title-' + item.id} className="font-bold">{item.name.trim() || 'Item ' + number}</h4>
      <button type="button" className="icon-button" onClick={remove} aria-label={'Remover item ' + (item.name.trim() || number)}>
        <Icon name="trash" />
      </button>
    </div>
    <div className="item-fields">
      <Field id={nameId} label="Nome do item" error={errors[nameId]}>
        <input id={nameId} value={item.name} placeholder="Ex.: Guarda-roupa" required {...errorAttrs(nameId, errors[nameId])}
          onChange={(event) => update({ name: event.target.value })} />
      </Field>
      <Field id={qtyId} label="Quantidade" error={errors[qtyId]}>
        <input id={qtyId} type="number" inputMode="numeric" min="1" step="1" required value={item.quantity ?? ''}
          {...errorAttrs(qtyId, errors[qtyId])}
          onChange={(event) => update({ quantity: Number.isNaN(event.target.valueAsNumber) ? null : event.target.valueAsNumber })} />
      </Field>
    </div>
    <fieldset className="mt-4">
      <legend className="field-label">Serviços para este item</legend>
      <div className="flex flex-wrap gap-2">
        {serviceOptions.map(({ id, label }) => <label key={id} className="check-control">
          <input type="checkbox" checked={item.services[id]}
            onChange={(event) => update({ services: { ...item.services, [id]: event.target.checked } })} />
          <Checkmark />{label}
        </label>)}
      </div>
      {selectedServices(item).length === 0 && <p className="transport-note"><Icon name="truck" />Só transporte</p>}
    </fieldset>
    <div className="mt-4">
      <Field id={notesId} label="Observação do item" optional>
        <input id={notesId} value={item.notes} placeholder="Ex.: Frágil" onChange={(event) => update({ notes: event.target.value })} />
      </Field>
    </div>
  </article>;
}

function Inventory({ order, change, errors }: { order: Order; change: MoveFormProps['onChange']; errors: Record<string, string> }) {
  const [roomName, setRoomName] = useState('');
  const pendingFocus = useRef('');
  useEffect(() => {
    if (pendingFocus.current) {
      document.getElementById(pendingFocus.current)?.focus();
      pendingFocus.current = '';
    }
  }, [order]);

  function addRoom(name: string) {
    const id = makeId();
    pendingFocus.current = 'room-' + id;
    change({ ...order, rooms: [...order.rooms, { id, name: name.trim(), items: [] }] });
    setRoomName('');
  }

  function updateRoom(updated: Room) {
    change({ ...order, rooms: order.rooms.map((room) => room.id === updated.id ? updated : room) });
  }

  return <div className="form-section">
    <div className="inventory-tools">
      <Field id="new-room" label="Novo cômodo">
        <input id="new-room" value={roomName} placeholder="Ex.: Escritório"
          onChange={(event) => setRoomName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addRoom(roomName);
            }
          }} />
      </Field>
      <button type="button" className="button outline" onClick={() => addRoom(roomName)}><Icon name="plus" />Adicionar cômodo</button>
    </div>
    <div className="suggestions" aria-label="Sugestões de cômodos">
      {['Sala', 'Quarto', 'Cozinha'].map((name) =>
        <button key={name} type="button" className="suggestion" onClick={() => addRoom(name)}>
          <Icon name={roomIcon(name)} />{name}<Icon name="plus" />
        </button>)}
    </div>
    {errors['items'] && <p className="field-error mt-3" role="alert">{errors['items']}</p>}
    {order.rooms.length === 0 && <div className="empty-state mt-5"><Icon name="package" /><p>Adicione um cômodo para começar a listar os itens.</p></div>}
    {order.rooms.length > 0 && <p className="helper-text mt-5"><Icon name="info" />Os serviços valem para toda a quantidade da linha. Se parte dos itens precisar de serviços diferentes, adicione outra linha.</p>}
    <div className="mt-5 grid gap-4">
      {order.rooms.map((room) => {
        const roomId = 'room-' + room.id;
        return <section className="room-editor" key={room.id} aria-label={room.name.trim() || 'Cômodo sem nome'}>
          <div className="room-editor-head">
            <span className="icon-tile self-end"><Icon name={roomIcon(room.name)} /></span>
            <Field id={roomId} label="Nome do cômodo" error={errors[roomId]}>
              <input id={roomId} value={room.name} required placeholder="Ex.: Sala" {...errorAttrs(roomId, errors[roomId])}
                onChange={(event) => updateRoom({ ...room, name: event.target.value })} />
            </Field>
            <button type="button" className="icon-button self-end" aria-label={'Remover cômodo ' + room.name}
              onClick={() => {
                if (!room.items.length || window.confirm('Remover este cômodo e todos os seus itens?')) {
                  pendingFocus.current = 'new-room';
                  change({ ...order, rooms: order.rooms.filter(({ id }) => id !== room.id) });
                }
              }}><Icon name="trash" /></button>
          </div>
          <div className="grid gap-3">
            {room.items.map((item, index) => <ItemEditor key={item.id} item={item} number={index + 1} errors={errors}
              update={(patch) => updateRoom({ ...room, items: room.items.map((entry) => entry.id === item.id ? { ...entry, ...patch } : entry) })}
              remove={() => {
                pendingFocus.current = 'add-item-' + room.id;
                updateRoom({ ...room, items: room.items.filter(({ id }) => id !== item.id) });
              }} />)}
          </div>
          <button id={'add-item-' + room.id} type="button" className="button outline mt-3"
            onClick={() => {
              const item = newItem();
              pendingFocus.current = 'item-' + item.id;
              updateRoom({ ...room, items: [...room.items, item] });
            }}><Icon name="plus" />Adicionar item</button>
        </section>;
      })}
    </div>
  </div>;
}

function Review({ order, edit }: { order: Order; edit: (step: Step) => void }) {
  return <div className="form-section review-grid">
    <section>
      <div className="summary-heading"><h3>Trajeto e acesso</h3><button type="button" onClick={() => edit(0)} className="button text-button">Editar dados</button></div>
      <dl className="route-facts">
        {addressOptions.map(({ id, label }) => <div key={id}><dt>{label}</dt><dd>{formatAddress(order[id]) || 'Não informado'}</dd></div>)}
        <div><dt>Data prevista</dt><dd>{formatDate(order) || 'Não informada'}</dd></div>
        <div><dt>Observações de acesso</dt><dd className="whitespace-pre-wrap">{order.accessNotes.trim() || 'Não informadas'}</dd></div>
      </dl>
    </section>
    <section>
      <div className="summary-heading"><h3>Itens por cômodo</h3><button type="button" onClick={() => edit(1)} className="button text-button">Editar itens</button></div>
      {filledRooms(order).map((room) => <div key={room.id} className="review-room">
        <h4><Icon name={roomIcon(room.name)} />{room.name}</h4>
        <ul>
          {room.items.map((item) => {
            const services = selectedServices(item);
            return <li key={item.id}>
              <strong>{item.quantity} × {item.name}</strong>
              <div className="service-list">
                {services.length ? services.map(({ id, label, icon }) =>
                  <span className="service-chip" data-service={id} key={id}><Icon name={icon} />{label}</span>) : <span className="service-chip transport"><Icon name="truck" />Só transporte</span>}
              </div>
              {item.notes.trim() && <p className="item-note">{item.notes}</p>}
            </li>;
          })}
        </ul>
      </div>)}
    </section>
  </div>;
}

export function MoveForm({ order: initialOrder, step, onChange, onStepChange, onConfirm }: MoveFormProps) {
  const [order, setOrder] = useState(initialOrder);
  const [attemptedDetails, setAttemptedDetails] = useState(false);
  const [attemptedItems, setAttemptedItems] = useState(false);
  const [focusRequest, setFocusRequest] = useState<{ id: string } | null>(null);
  const errors = validate(order);
  const hasDraft = JSON.stringify(order) !== JSON.stringify(emptyOrder());
  const validItems = order.rooms.flatMap((room) => room.items).filter(validItem);
  const units = validItems.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  useEffect(() => {
    if (focusRequest) document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest, step]);

  function change(next: Order) {
    setOrder(next);
    onChange(next);
  }

  function goTo(next: Step, focusId = 'step-title') {
    onStepChange(next);
    setFocusRequest({ id: focusId });
  }

  function navigate(next: Step) {
    if (next >= 1 && Object.keys(errors.details).length) {
      setAttemptedDetails(true);
      goTo(0, Object.keys(errors.details)[0]);
      return;
    }
    if (next >= 2 && Object.keys(errors.inventory).length) {
      setAttemptedItems(true);
      const first = Object.keys(errors.inventory).find((id) => id !== 'items');
      goTo(1, first ?? (order.rooms.length ? 'add-item-' + order.rooms[0].id : 'new-room'));
      return;
    }
    goTo(next);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 2) {
      navigate(step === 0 ? 1 : 2);
    } else if (Object.keys(errors.details).length || Object.keys(errors.inventory).length) {
      navigate(2);
    } else {
      onConfirm(order);
    }
  }

  function replaceDraft(example: boolean) {
    if (hasDraft && !window.confirm(example ? 'Substituir o pedido atual pelo exemplo?' : 'Limpar todos os dados deste pedido?')) return;
    change(example ? exampleOrder() : emptyOrder());
    setAttemptedDetails(false);
    setAttemptedItems(false);
    goTo(0);
  }

  function demoCard() {
    return <section className="demo-card">
      <span className="demo-icon"><Icon name="sparkle" /></span>
      <h2>Experimente com um exemplo</h2>
      <p>Veja como fica uma mudança do Água Verde para o Cabral, em Curitiba.</p>
      <button type="button" className="button demo-button" onClick={() => replaceDraft(true)}>Carregar exemplo<Icon name="arrow-right" /></button>
      {hasDraft && <button type="button" className="button reset-button" onClick={() => replaceDraft(false)}>Começar do zero</button>}
    </section>;
  }

  return <div className="client-layout">
    <div className="min-w-0">
      {step === 0 && <div className="mobile-demo">{demoCard()}</div>}
      <nav className="stepper" aria-label="Etapas do pedido">
        <ol>
          {steps.map((label, index) => <li key={label}>
            <button type="button" aria-current={index === step ? 'step' : undefined}
              className={index < step ? 'step completed' : index === step ? 'step active' : 'step'}
              onClick={() => index !== step && (index < step ? goTo(index as Step) : navigate(index as Step))}>
              <span className="step-number">{index < step ? <Icon name="check" /> : index + 1}</span><span>{label}</span>
            </button>
          </li>)}
        </ol>
      </nav>
      <form className="panel" onSubmit={submit} noValidate>
        <div className="form-heading">
          <h2 id="step-title" tabIndex={-1}>{steps[step]}</h2>
          <p>{introductions[step]}</p>
        </div>
        {step === 0 && <Details order={order} change={change} errors={attemptedDetails ? errors.details : {}} />}
        {step === 1 && <Inventory order={order} change={change} errors={attemptedItems ? errors.inventory : {}} />}
        {step === 2 && <Review order={order} edit={goTo} />}
        <div className="form-actions">
          {step > 0 && <button type="button" className="button outline" onClick={() => goTo(step === 1 ? 0 : 1)}><Icon name="arrow-left" />Voltar</button>}
          <button type="submit" className="button primary">{step === 0 ? 'Continuar para itens' : step === 1 ? 'Revisar pedido' : 'Gerar ficha de orçamento'}<Icon name={step === 2 ? 'clipboard' : 'arrow-right'} /></button>
        </div>
      </form>
    </div>
    <aside className="sidebar" aria-label="Resumo e dados de demonstração">
      <section className="panel sidebar-summary">
        <div className="sidebar-head"><span className="icon-tile"><Icon name="clipboard" /></span><h2>Resumo do pedido</h2></div>
        <ol className="mini-route">
          {addressOptions.map(({ id, label }) => <li key={id}>
            <span className={'route-dot ' + id} aria-hidden="true"><Icon name={id === 'origin' ? 'pin' : 'flag'} /></span>
            <div><span>{label}</span><strong>{formatAddress(order[id]) || 'A preencher'}</strong></div>
          </li>)}
        </ol>
        <div className="sidebar-fact"><Icon name="calendar" /><span>{formatDate(order) || 'Data a preencher'}</span></div>
        <div className="sidebar-fact"><Icon name="package" /><span>{order.rooms.length} {order.rooms.length === 1 ? 'cômodo' : 'cômodos'} · {units} {units === 1 ? 'unidade' : 'unidades'}</span></div>
      </section>
      {demoCard()}
    </aside>
  </div>;
}
