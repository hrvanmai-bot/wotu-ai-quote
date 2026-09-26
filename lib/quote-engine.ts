export type Product={code:string;name:string;category:string;unit:string;price:number;material:string;active:boolean;note?:string};
export type QuoteItem={id:string;section:string;name:string;description:string;unit:string;qty:number;unitPrice:number;material?:string;code?:string};
export type QuoteState={id:string;customer:string;project:string;items:QuoteItem[];discount:number;createdAt:string;updatedAt:string};
export type Knowledge={id:string;title:string;content:string;enabled:boolean;createdAt:string};
export type QuoteHistory={id:string;quoteId:string;time:string;action:string;total:number;snapshot:QuoteState};
export const catalog:Product[]=[
{code:"TB-IN-A",name:"Tủ bếp dưới Inox 304 - Cánh Acrylic",category:"Tủ bếp",unit:"MD",price:4650000,material:"Inox 304 / Acrylic",active:true},
{code:"TB-PLY-M",name:"Tủ bếp trên Plywood - Melamine",category:"Tủ bếp",unit:"MD",price:2800000,material:"Plywood phủ Melamine",active:true},
{code:"TB-PLY-A",name:"Tủ bếp cao kịch trần Plywood - Acrylic",category:"Tủ bếp",unit:"MD",price:2950000,material:"Plywood / Acrylic",active:true},
{code:"GLASS-008",name:"Kính ốp bếp cường lực 8mm",category:"Bếp",unit:"MD",price:900000,material:"Kính cường lực",active:true},
{code:"STONE-LAMAR",name:"Đá Lamar mặt bếp và bàn đảo",category:"Bếp",unit:"MD",price:2250000,material:"Đá Lamar",active:true},
{code:"GAR-GP0280E",name:"Giá xoong nồi Garis GP02.80E",category:"Phụ kiện bếp",unit:"Cái",price:3650000,material:"Inox 304",active:true},
{code:"LED-001",name:"Hệ LED hắt sáng",category:"Điện / LED",unit:"MD",price:250000,material:"Nhôm định hình + Adapter",active:true},
{code:"SENSOR-001",name:"Cảm biến LED",category:"Điện / LED",unit:"Cái",price:150000,material:"Cảm biến",active:true},
{code:"RAY-001",name:"Ray giảm chấn",category:"Phụ kiện",unit:"Bộ",price:450000,material:"Ray giảm chấn",active:true},
{code:"TR-THACHCAO-001",name:"Trần thạch cao khung chìm",category:"Trần",unit:"m²",price:185000,material:"Khung xương + tấm thạch cao",active:true},
{code:"PLY-WARDROBE",name:"Tủ quần áo cánh mở Plywood - Melamine",category:"Tủ áo",unit:"m²",price:2650000,material:"Plywood phủ Melamine",active:true},
{code:"BED-18",name:"Giường ngủ 1m8 Plywood - Melamine",category:"Phòng ngủ",unit:"Bộ",price:6500000,material:"Plywood phủ Melamine",active:true},
{code:"LAVABO-CB",name:"Combo tủ Lavabo",category:"Phòng tắm",unit:"Bộ",price:6500000,material:"Nhựa chống nước",active:true}
];
export const money=(n:number)=>new Intl.NumberFormat("vi-VN").format(Math.round(n))+" ₫";
export function totals(q:QuoteState){const subtotal=q.items.reduce((s,i)=>s+i.qty*i.unitPrice,0);const discount=subtotal*q.discount/100;return{subtotal,discount,total:subtotal-discount}};
export function emptyQuote():QuoteState{const now=new Date().toISOString();return{id:crypto.randomUUID(),customer:"",project:"",items:[],discount:0,createdAt:now,updatedAt:now}};
export function applyAICommand(state:QuoteState,data:any,products:Product[]){const next=structuredClone(state);if(data.action==="create")next.items=[];for(const code of data.removeCodes||[])next.items=next.items.filter(i=>i.code!==code);for(const x of data.items||[]){const p=products.find(p=>p.code===x.code&&p.active);if(!p)continue;const existing=next.items.find(i=>i.code===p.code);const item={id:existing?.id||crypto.randomUUID(),section:existing?.section||p.category,name:p.name,description:p.material,unit:p.unit,qty:x.qty,unitPrice:x.unitPrice??p.price,material:p.material,code:p.code};if(existing)Object.assign(existing,item);else next.items.push(item)}if(data.discount!==null&&data.discount!==undefined)next.discount=data.discount;next.updatedAt=new Date().toISOString();return next}