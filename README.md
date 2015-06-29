Network vis provides visualization of network topology for the given LAN segment.
Server-side: nodejs / snmp / icmp / postgresql.
Client-side: angularjs + jointjs (SVG).
Since all nodes are rendered in SVG user can use the built-in browser search. It is possible to interact with the nodes (move, arrange, highlight the neighbors). Nodes are pinged from the server and display their status in real time. The links are detected by Cisco cdp protocol.

Currently this application is not ready for production and is used for my own administrative tasks only.

![ScreenShot](https://raw.github.com/minkolazer/neteye/master/neteye-1.png)

![ScreenShot](https://raw.github.com/minkolazer/neteye/master/neteye-2.png)

![ScreenShot](https://raw.github.com/minkolazer/neteye/master/neteye-3.png)

Copyright (C) 2014 by Minko

