import os,pathlib,signal,socket,subprocess,time,urllib.request,json
out=pathlib.Path(__file__).parent;cwd=out.parents[1]/'questhabit2';servers=[];logs=[]
def port():
 with socket.socket()as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
try:
 urls=[]
 for mode,script in [('dev','dev'),('production','preview')]:
  p=port();log=(out/f'quest-{mode}-server.log').open('w');logs.append(log);args=['npm','exec','--yes','--package=node@22.23.5','--','node','node_modules/vite/bin/vite.js']+(['preview']if script=='preview'else[])+['--host','127.0.0.1','--port',str(p),'--strictPort'];proc=subprocess.Popen(args,cwd=cwd,stdout=log,stderr=subprocess.STDOUT,start_new_session=True);servers.append(proc);url='http://127.0.0.1:'+str(p)
  for _ in range(160):
   if proc.poll()is not None:raise RuntimeError(mode+' server exited')
   try:
    with urllib.request.urlopen(url,timeout=1)as response:
     if response.status==200:break
   except Exception:time.sleep(.1)
  else:raise RuntimeError(mode+' server did not start')
  urls.append(url)
 with(out/'quest-browser.log').open('w')as log:result=subprocess.run(['npm','exec','--yes','--package=node@22.23.5','--','node',str(out/'quest-browser.mjs'),*urls],cwd=cwd,stdout=log,stderr=subprocess.STDOUT)
 print('Browser exit',result.returncode,flush=True)
 if result.returncode:print((out/'quest-browser.log').read_text()[-6000:],flush=True)
 raise SystemExit(result.returncode)
finally:
 for p in servers:
  try:os.killpg(p.pid,signal.SIGTERM)
  except ProcessLookupError:pass
  try:p.wait(timeout=5)
  except subprocess.TimeoutExpired:os.killpg(p.pid,signal.SIGKILL);p.wait()
 for log in logs:log.close()
 (out/'quest-owned-servers-stopped.json').write_text(json.dumps({'allOwnedServersStopped':all(p.poll()is not None for p in servers),'pids':[p.pid for p in servers]},indent=2)+'\n')
