StandaLock
==========
A standalone slide bar that your visitors unlock using _drag and drop_ to prevent spambots for harvesting sensitive, private information stored in your web pages such as email address and phone number.

![StandaLock in action](http://timlegrand.github.io/assets/images/StandaLock.gif)

How it works?
---------------
  1. Add a placeholder for the StandaLock in your HTML:

     ```html
     <div id="mystandalock"></div>
     ```

     You may also add another empty div that will contain your personal information when shown (optional):

     ```html
     <div id="contact"></div>
     ```

  2. Encrypt your personal information and prepare to provide a decrypt function. Remember that we are not fighting against humans but spambots, which search for particular patterns in clear text in a reasonable time. I personally use Base64 or ROT13 algorithms which seem to be enough. Make sure your information never appears in clear text. For an even better efficiency, try not to associate encrypted private information obvious variable names like "email" or "address" (tips provided in the next step).

  3. Set it up:

     ```html
     <script src="/path/to/standalock.js"></script>
     <script type="text/javascript" charset="utf-8">
      function load(){
        var config1 = {
          message: 'Slide to unlock contact info',
          placeholder: '#mystandalock',
          data: {
            m-a-i-l: 'cHJpdmF0ZUBleGFtcGxlLmNvbQ==',
            t-e-l: 'MSg1NTUpNTU1LTU1NTU='
          },
          decrypt: function(value) {
            // my own decrypt function:
            return window.atob(value);
          },
          template: '<p>mail:{{m-a-i-l}} tel:{{t-e-l}}</p>'
        };
        StandaLock
          .add(config1)
          .render();
      }
      window.addEventListener('load', load, false);
      </script>
     ```
     in the header (or footer, both ways work).
     Please have a look on the [documentation](#doc) for further details.

What it does?
---------------
  * Keeps your personal information safe from spambots and other malicious harvesting techniques;
  * Tells you if visitor is Human;
  * Supports for custom designs, both image- or HTML-based, for better integration in your exixting pages.
  * Handles everything that can be represented as plain text: email, address, images...

Why a slidelock?
---------------
Wondering about privacy and [spambot harvesting](http://en.wikipedia.org/wiki/Email_address_harvesting)? Many articles on the web are discussing about the best ways to protect personal information (PI) and prevent bots from using them for spam.
A short resume of the state of the art could be:
  1. Spambots read HTML, so do not write PI in your web pages.
  2. The only way to know if the visitor is not a bot is making him proving is human.
  3. GUI-based actions (like reading a Captcha, listing to audio, picking an object of a certain kind or drawing a sheep) have the best results since no spambot can afford the computing power needed to process such inputs in a reasonnable time for brute force attacks.
  4. Slidelocks are a simple, user-friendly, device-agnostic way to do it compared to Captchas which require text input, focus, and multiple retries to get it unlocked.

In addition, these countermeasures support clickable email links (which cannot be done with HTML offuscation, for example).

Why standalone?
---------------
  5. It turns out that every slidelock found on the web is based on a client-server model implying various handshakes that end with the retrieval of PI from the server. But what if you cannot ask the server? What if the server cannot run PHP or Python? Today many websites are static-pages servers (Harp, Jekyll, etc.) as for GitHub.io. In these cases such slidelocks won't work.
  6. Spambots can read Javascipt. So writing

     ```javascript
     my_email = "personal@example.com";
     document.getElementById('my_contact_div').innerHTML = '<p>' + my_email + '</p>';
     ```
     will not work either since the spambot can clearly read the line `my_email = "personal@example.com";`.
  7. Embedding encrypted PI and decrypting it with Javascript at render time is useless since the rendered web page read by spambots will contain clear PI.
  8. So solution is to decrypt and render PI only if visitor is human, that is, if he manually unlocked the slide lock via GUI.

This solution is in pure **client-side** Javascript, so no server implementation or communication is required:
* runs on static websites such as Jekyll servers,
* still runs if you loose network connection on your mobile,
* don't wait for the server to respond, get unlocked information instantly!

Of course, if you don't want to provide your decrypt function either, you can host it on your own server and give a ```decryptUrl``` instead. Awesome? Yes.

<a name="doc"></a>Documentation
-------------
The new api has two methods only.

#### ```StandaLock.add(Object: config)```

This method adds a new Standalock configuration to the jobs queue. This method is chainable.

#### ```StandaLock.render()``` 

This method renders all the queued jobs.

### The ```config``` object accepts the following attributes:
  * ```String: placeholder```: the CSS selector for the placeholder where the StandaLock canvas will be rendered (e.g. '#mylockhere');
  * ```String: message```: A message that will be printed to the user prior to the StandaLock;
  * ```Object: data``` (optional): An associative array (key/value hash) containing the encrypted user's data;
  * ```Function: decrypt``` (optional): A function that is used to decrypt the user's data. This attributes is mandatory if the ```data```object was provided;
  * ```String: decryptUrl``` (optional): An url of a remote script that encapsulates the decryption algorithm. This attributes is mandatory if the ```data``` object was provided with no ```decrypt``` function. Please note that if both the ```decrypt```function and the ```decryptUrl``` are provided, only the ```decryptUrl``` will be used;
  * ```String: template```: An HTML template that will be showed after the unlock process has succeded. 
  In order to print out the decrypted value form the provided ```data``` attribute, use the ```{{key}}``` syntax inside the template;
  * ```String: outputPlaceholder``` (optional): the CSS selector for the placeholder where the decrypted data will be printed (e.g. '#myphonehere').

### Testing

  We added a ```server.js``` script to demonstrate the ```decryptUrl``` feature. In order to use it, just run

  ``` 
  node server.js
  ```

### Examples

  * A simple StandaLock with automatic insertion of decrypted data
  
  ```
  <script type="text/javascript" charset="utf-8">
      function load(){
        var config1 = {
          message: 'Slide to unlock contact info',
          placeholder: '#mystandalock',
          data: {
            mailto: 'cHJpdmF0ZUBleGFtcGxlLmNvbQ==',
            tel: 'MSg1NTUpNTU1LTU1NTU='
          },
          decrypt: function(value) {
            // my own decrypt function:
            return window.atob(value);
          },
          template: '<p>mail:{{mailto}} tel:{{tel}}</p>'
        };
        StandaLock
          .add(config1)
          .render();
      }
      window.addEventListener('load', load, false);
  </script>
  ```

  * StandaLock and ouput printed at different locations:
  
  ```
  <body>
    <div id="standalockhere"></div>
    ...
    <div id="outputhere"></div>
    <script type="text/javascript" charset="utf-8">
        function load(){
          var myconf = {
            message: 'Info will appear somewhere else',
            placeholder: '#standalockhere',
            outputPlaceholder: '#outputhere',
            data: {
              mailto: 'cHJpdmF0ZUBleGFtcGxlLmNvbQ==',
              tel: 'MSg1NTUpNTU1LTU1NTU='
            },
            decrypt: function(value) {
              return window.atob(value);
            },
            template: '<p>mail:{{mailto}} tel:{{tel}}</p>'
          };
          StandaLock
            .add(myconf)
            .render();
        }
        window.addEventListener('load', load, false);
    </script>
  </body>
  ```

  * Reveal a submit button only if visitor is Human:
  
  ```
  <body>
    <div id="#standalock-3"></div>
    <script type="text/javascript" charset="utf-8">
        function load(){
          var config3 = {
            message: 'Slide to unlock a submit button',
            placeholder: '#standalock-3',
            template: '<p><button onclick="alert(\'DONE\')">Click me</button></p>'
          };
          StandaLock
            .add(config3)
            .render();
        }
        window.addEventListener('load', load, false);
    </script>
  </body>
  ```

  * Decrypt data via a remote server (so your ```decrypt``` function is kept secret):
  
  ```
  <body>
    <div id="#standalock-4"></div>
    <script type="text/javascript" charset="utf-8">
        function load(){
          var config4 = {
          placeholder: '#standalock-4',
          message: 'Slide to decrypt from a remote server',
          data: {
            mail: "AC:G2E6o6I2>A=6]4@>", // ROT47
            tel: '`WdddXddd\dddd' // ROT47
          },
          decryptUrl: 'http://localhost:1337',
          template: 'mail:{{mail}} tel:{{tel}}'
        };
          StandaLock
            .add(config4)
            .render();
        }
        window.addEventListener('load', load, false);
    </script>
  </body>
  ```

  * Declaring multiple locks for double proof:
  
  ```
  <body>
    <div id="standalock-1"></div>
    <div id="standalock-2"></div>
    <script src="./standalock.js"></script>
    <script type="text/javascript" charset="utf-8">
      function load(){
        var config1 = {
          message: 'Are you Human?',
          placeholder: '#standalock-1',
          ...
        };
        var config2 = {
          message: 'Are you sure?',
          placeholder: '#standalock-2',,
          ...
        };
        StandaLock
          .add(config1)
          .add(config2)
          .render();
      }
      window.addEventListener('load', load, false);
    </script>
  </body>
  ```

Limitations
-----------
  At this time it is not possible to bind several output placeholders to the same StandaLock. It will be solved in further releases.

License
-------
This software (graphics artwork included) is provided under the MIT license. Please read LICENSE file for further information.
The canvas implementation is based on Red Hammond HTML5 canvas works you can find on [his GitHub page](https://github.com/rheh/HTML5-canvas-projects/tree/master/progress). A detailed explanation of the HTML5 canvas construction of his original slidebar can be found [here](http://geeksretreat.wordpress.com/2012/08/13/a-progress-bar-using-html5s-canvas/). 
Full credit for the original digital image goes [here](http://365psd.com/day/106/) (this version was a bit modified).
