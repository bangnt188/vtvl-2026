// XLSX đọc ở trình duyệt: không gửi file lên mạng, không sửa tệp.
// Giới hạn kích thước và phân giải ZIP theo central directory để tránh xử lý archive độc hại.
const MAX_FILE=50*1024*1024, MAX_UNZIP=100*1024*1024, MAX_PART=40*1024*1024, MAX_ENTRIES=1200;
const dec=new TextDecoder('utf-8');
const die=(s)=>{throw new Error(s)};
const read16=(d,i)=>d.getUint16(i,true),read32=(d,i)=>d.getUint32(i,true);
async function unzip(file){
  if(!file||file.size>MAX_FILE)die('File vượt giới hạn 50 MB.');
  const bytes=new Uint8Array(await file.arrayBuffer()),d=new DataView(bytes.buffer);
  if(bytes.length<22||read32(d,0)!==0x04034b50)die('Không phải XLSX dạng ZIP.');
  let end=-1;for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){
    if(read32(d,i)===0x06054b50){end=i;break}
  }
  if(end<0)die('Không tìm thấy thư mục ZIP (End of Central Directory).');
  const count=read16(d,end+10),offset=read32(d,end+16);
  if(count===0xffff||offset===0xffffffff)die('ZIP64 hiện chưa được hỗ trợ.');
  if(count>MAX_ENTRIES)die('Quá nhiều thành phần trong XLSX.');
  const archive={}; let pos=offset, total=0;
  for(let j=0;j<count;j++){
    if(pos+46>bytes.length||read32(d,pos)!==0x02014b50)die('Central Directory bị lỗi.');
    const flags=read16(d,pos+8),method=read16(d,pos+10);
    const comp=read32(d,pos+20),raw=read32(d,pos+24),nameLen=read16(d,pos+28),
          extraLen=read16(d,pos+30),commentLen=read16(d,pos+32),local=read32(d,pos+42);
    const name=dec.decode(bytes.subarray(pos+46,pos+46+nameLen));
    pos+=46+nameLen+extraLen+commentLen;
    if(!name||name.includes('..')||name.startsWith('/')||name.includes('\\'))die('Đường dẫn ZIP không an toàn.');
    if(flags & 1)die('File ZIP được mã hóa không được hỗ trợ.');
    if(raw>MAX_PART||(total+=raw)>MAX_UNZIP)die('Tổng dung lượng giải nén vượt giới hạn an toàn.');
    if(method!==0&&method!==8)die('Phương pháp nén ZIP không hỗ trợ: '+method);
    if(local+30>bytes.length||read32(d,local)!==0x04034b50)die('Local header bị lỗi.');
    const dataAt=local+30+read16(d,local+26)+read16(d,local+28);
    if(dataAt+comp>bytes.length)die('Dữ liệu ZIP bị cắt cụt.');
    if(name.endsWith('/'))continue;
    if(Object.hasOwn(archive,name))die('Trùng tên thành phần trong ZIP: '+name);
    const blob=bytes.subarray(dataAt,dataAt+comp);
    let out;
    if(method===0)out=blob;
    else{
      if(typeof DecompressionStream!=='function')die('Trình duyệt chưa hỗ trợ giải nén XLSX. Dùng Chrome/Edge bản mới.');
      try{
        const stream=new Blob([blob]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
        const reader=stream.getReader(),chunks=[];let size=0;
        while(true){
          const part=await reader.read();if(part.done)break;
          size+=part.value.byteLength;
          if(size>raw || size>MAX_PART){await reader.cancel();die('Giải nén vượt kích thước đã khai báo: '+name);}
          chunks.push(part.value);
        }
        out=new Uint8Array(size);let at=0;
        for(const chunk of chunks){out.set(chunk,at);at+=chunk.byteLength}
      }catch(e){die('Không thể giải nén "'+name+'". Cần trình duyệt hỗ trợ deflate-raw hoặc file ZIP khác.')}
    }
    if(out.length!==raw)die('Kích thước giải nén không đúng: '+name);
    archive[name]=out;
  }
  return archive;
}
const bytesToText=(part)=>part===undefined?null:dec.decode(part);
function xml(bytes,path){
  if(!bytes)die('Thiếu thành phần bắt buộc: '+path);
  const x=new DOMParser().parseFromString(bytesToText(bytes),'application/xml');
  if(x.getElementsByTagName('parsererror').length)die('XML lỗi: '+path);
  return x;
}
function nodes(parent,tag){return [...parent.getElementsByTagNameNS('*',tag)]}
function direct(node,tag){return [...node.children].find(x=>x.localName===tag)}
function directList(node,tag){return [...node.children].filter(x=>x.localName===tag)}
function val(cell,shared){
  const t=cell.getAttribute('t'); if(t==='inlineStr')return nodes(cell,'is').flatMap(n=>nodes(n,'t')).map(n=>n.textContent).join('');
  const v=direct(cell,'v')?.textContent??'';
  if(t==='s') return shared[Number(v)]??'';
  return v;
}
function relTarget(base,target){
  if(/^[a-z]+:/i.test(target))die('Workbook có relationship liên kết ngoài không hỗ trợ.');
  const seg=(target.startsWith('/')?target.slice(1):(base+'/'+target)).split('/');
  const parts=[];
  for(const s of seg){if(!s||s==='.')continue;if(s==='..'){if(!parts.length)die('Relationship vượt đường dẫn gốc.');parts.pop();}else parts.push(s)}
  return parts.join('/');
}
export async function parseXlsx(file){
  const archive=await unzip(file);
  const all=Object.keys(archive).sort();
  const wb=xml(archive['xl/workbook.xml'],'xl/workbook.xml');
  const rels=xml(archive['xl/_rels/workbook.xml.rels'],'xl/_rels/workbook.xml.rels');
  const relById={};
  for(const rel of nodes(rels,'Relationship'))if(!rel.getAttribute('TargetMode')||rel.getAttribute('TargetMode')!=='External'){
    relById[rel.getAttribute('Id')]=relTarget('xl',rel.getAttribute('Target'));
  }
  const shared=[];
  if(archive['xl/sharedStrings.xml']){
    const s=xml(archive['xl/sharedStrings.xml'],'xl/sharedStrings.xml');
    for(const item of nodes(s,'si'))shared.push(nodes(item,'t').map(n=>n.textContent).join(''));
  }
  const sheets={};
  for(const entry of nodes(wb,'sheet')){
    const name=entry.getAttribute('name'),rid=entry.getAttribute('r:id')||entry.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id');
    const path=relById[rid];
    if(!path)die('Không tìm thấy relationship cho sheet: '+name);
    const x=xml(archive[path],path),cells={};
    for(const c of nodes(x,'c')){
      const address=c.getAttribute('r');if(!address)continue;
      cells[address]={value:val(c,shared),formula:direct(c,'f')?.outerHTML??null};
    }
    sheets[name]={name,path,cells,
      merges:nodes(x,'mergeCell').map(e=>e.getAttribute('ref')).sort(),
      validations:nodes(x,'dataValidation').map(e=>e.outerHTML).sort()
    };
  }
  const parts={};
  for(const p of ['xl/styles.xml','xl/workbook.xml','xl/_rels/workbook.xml.rels','[Content_Types].xml'])if(archive[p])parts[p]=bytesToText(archive[p]);
  return {filename:file.name,entries:all,sheets,parts};
}
