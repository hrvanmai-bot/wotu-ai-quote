export type QuoteItem={id:string;section:string;name:string;description:string;unit:string;qty:number;unitPrice:number;material?:string;code?:string};
export type QuoteState={customer:string;project:string;items:QuoteItem[];discount:number};
export const catalog=[
{code:"TB-IN-A",name:"Tủ bếp dưới Inox 304 - Cánh Acrylic",unit:"MD",price:4650000,material:"Inox 304 / Acrylic"},
{code:"TB-PLY-M",name:"Tủ bếp trên Plywood - Melamine",unit:"MD",price:2800000,material:"Plywood phủ Melamine"},
{code:"TB-PLY-A",name:"Tủ bếp cao kịch trần Plywood - Acrylic",unit:"MD",price:2950000,material:"Plywood phủ Melamine / MDF Acrylic"},
{code:"GLASS-008",name:"Kính ốp bếp cường lực 8mm",unit:"MD",price:900000,material:"Kính cường lực sơn màu"},
{code:"STONE-LAMAR",name:"Đá Lamar mặt bếp và bàn đảo",unit:"MD",price:2250000,material:"Đá Lamar"},
{code:"GAR-GP0280E",name:"Giá xoong nồi Garis GP02.80E",unit:"Cái",price:3650000,material:"Inox 304"},
{code:"LED-001",name:"Hệ LED hắt sáng",unit:"MD",price:250000,material:"Nhôm định hình + Adapter"},
{code:"SENSOR-001",name:"Cảm biến LED",unit:"Cái",price:150000,material:"Cảm biến"},
{code:"RAY-001",name:"Ray giảm chấn",unit:"Bộ",price:450000,material:"Ray giảm chấn"},
{code:"TR-THACHCAO-001",name:"Trần thạch cao khung chìm",unit:"m²",price:185000,material:"Khung xương + tấm thạch cao"},
{code:"PLY-WARDROBE",name:"Tủ quần áo cánh mở Plywood - Melamine",unit:"m²",price:2650000,material:"Plywood phủ Melamine chống ẩm"},
{code:"BED-18",name:"Giường ngủ 1m8 Plywood - Melamine",unit:"Bộ",price:6500000,material:"Plywood phủ Melamine chống ẩm"},
{code:"LAVABO-CB",name:"Combo tủ Lavabo",unit:"Bộ",price:6500000,material:"Nhựa chống nước sơn hoàn thiện"}];
export const money=(n:number)=>new Intl.NumberFormat("vi-VN").format(Math.round(n))+" ₫";
export function totals(q:QuoteState){const subtotal=q.items.reduce((s,i)=>s+i.qty*i.unitPrice,0);const discount=subtotal*q.discount/100;return{subtotal,discount,total:subtotal-discount}};
export function emptyQuote():QuoteState{return{customer:"",project:"",items:[],discount:0}};
export function applyAICommand(state:QuoteState,data:any){const next=structuredClone(state);if(data.action==="create")next.items=[];for(const code of data.removeCodes){next.items=next.items.filter(i=>i.code!==code)}for(const x of data.items){const p=catalog.find(p=>p.code===x.code);if(!p)continue;const existing=next.items.find(i=>i.code===x.code);const item={id:existing?.id||crypto.randomUUID(),section:existing?.section||"Hạng mục",name:p.name,description:p.material,unit:p.unit,qty:x.qty,unitPrice:x.unitPrice,material:p.material,code:p.code};if(existing)Object.assign(existing,item);else next.items.push(item)}if(data.discount!==null)next.discount=data.discount;return next}