// GGET DATA(): gathers feild inputs, makes calls to image urls
function getData () { //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
   //URLs to be converted
    logoURL = document.getElementsByName("logoURL")[0].value;
    sigImgURL = document.getElementsByName("sigImgURL")[0].value;
    issuingURL = document.getElementsByName("issuingURL")[0].value;
    tempFill = document.getElementsByName("tempFill")[0].value;
    // strings
    date = document.getElementsByName("date")[0].value;
    name = document.getElementsByName("name")[0].value;
    courseTitle = document.getElementsByName("courseTitle")[0].value;
    courseDesc = document.getElementsByName("courseDesc")[0].value;
    sigBlock = document.getElementsByName("sigBlock")[0].value;
    verification = document.getElementsByName("verification")[0].value;
    // booleans
    distinction = document.getElementsByName("distinction")[0].checked;
    
    console.log('Form data collected');
    // attempt calls to URLs to get images as 64bit string 
    getBase64FromImageUrl(logoURL, '1');
    getBase64FromImageUrl(sigImgURL, '2');
    getBase64FromImageUrl(issuingURL, '3');
    getBase64FromImageUrl(tempFill, '4');
       
    console.log('String parses called');   
} // end getData() ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// GET 64bit STRING(): Called by getData(), async calls. 
//Provides 64bit strings from image URLs, sets success flags. Attempts to initiate pdfBuild()
// Flag argument 'd' passed as a string, ugly switches used becuase passing bolleans by reference does not work
function getBase64FromImageUrl(URL, d) { // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // proxy image
    var img = new Image();
    // prevents tainted canvas
    img.setAttribute('crossOrigin', 'anonymous');
    // checks for input errors and possible CORS interference
    img.addEventListener('error', function (e) {
        e.preventDefault(); // Prevent error from getting thrown
    // IF ERROR: set failure flag, alert user, reload page
        switch (d){
            case d = '1': alert('Please choose another logo link. You may not have permission to access it.');
                          a1 = false;
                          location.reload();
                          break;
            case d = '2': alert('Please choose another signature link. You may not have permission to access it.');
                          a2 = false;
                          location.reload();
                          break;
            case d = '3': alert('Please choose another issusing institution link. You may not have permission to access it.');
                          a3 = false;
                          location.reload();
                          break;
            case d = '4': alert('Please choose another background template link. You may not have permission to access it.');
                          a4 = false;
                          location.reload();
                          break;
            default: console.log('bad param');
        }
    });
    // load img from URL
    img.src = URL;
    // CALLBACK - once img is loaded
    img.onload = function() {
        // proxy canvas
        var canvas = document.createElement("canvas");
        canvas.width = this.width;
        canvas.height = this.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(this, 0, 0);
        // switch assigns data URL to correct variable. assigns success flag
        switch (d){
            case d = '1': parsedLogo = canvas.toDataURL("image/jpg");
                          d1 = true;
                          break;
            case d = '2': parsedSig = canvas.toDataURL("image/jpg");
                          d2 = true;
                          break;
            case d = '3': parsedIssue = canvas.toDataURL("image/jpg");
                          d3 = true;
                          break;
            case d = '4': parsedTemplate = canvas.toDataURL("image/jpg");
                          d4 = true;
                          break;
            default: console.log('bad param');
        }
    // ATTEMPT to build pdf, will only work when all dataURLs are ready
        pdfBuild();
    };
}// end getBase64FromImageUrl() ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// TEXTWRAPPER: jsPDF doesn't wrap text, but an array of strings will be added on new lines
// cuts string into n length peices, returns array of fragments
function textWrapper(str, lineLen) { // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    var spaceAry = [0];
    var lastChar = str.length - 1;

    for (var i = 0; i < lastChar; i++){         // store addresses of all spaces in string
        if (str[i] === " "){
            spaceAry.push(i);
        } // if
    } // for

    var startCut = 0;
    var wrappedAry = [];

    for (var i = 0; i < spaceAry.length; i++) {
        if (spaceAry[i] - startCut >= lineLen) {    // make substrings out of largest number of full words < max line length
            var snip = str.substring(startCut, spaceAry[i]);
            wrappedAry.push(snip);
            startCut = spaceAry[i];             // save location of next subtring start
        } 
        if (i === spaceAry.length - 1 ) {       // collect any trailing characters that don't make a full line
            var snip = str.substring(startCut, str.length);
            wrappedAry.push(snip);
        } // if
    } // for
    return wrappedAry;
} // end textWrapper()~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// PDFBUILD() is called whenever a 64 bit string is returned. 
//Only proceeds with pdf generation when all flags are right
function pdfBuild(){
    // check to make sure all urls worked
    if (a1&&a2&&a3&&a4) {
        console.log('All URLs allowed');
        // check to make sure all strings have been returned
        if (!(d1&&d2&&d3&&d4)){
            // will not proceed until all are done, logs missing info
            console.log('Waiting \n' + 'Call 1: '
            + d1 + '\n' +'Call 2: ' + d2 +'\n' + 
            'Call 3: ' + d3 + '\n' + 'Call 4: ' + d4);
        } else {
            // when all async calls are done:
            console.log('all URLs parsed');
            // PDF SECTION ============================================================================
            // initialize pdf
            var testDoc = new jsPDF({
                orientation: 'landscape',
                unit: 'in',
                format: [8.5, 11],
            });
            alert('Generating PDF');

            // testDoc.setFont('Courier', ''); setFont() does not work, no fixes found on StackOverflow or Github

            var width = testDoc.internal.pageSize.width;    
            var height = testDoc.internal.pageSize.height;
            var sigLine = "_______________";
            
            // add images
            // Parameters(x, y, w, h):
            // x, y refers to the location the image is placed (top right-hand corner)
            // w, h are constraints on image size. If 0, image is scaled to only one dimension
            // background image first
            testDoc.addImage(parsedTemplate, 0, 0, 11, 0);
            // main logo
            testDoc.addImage(parsedLogo,(.65*width), (.40*height), (.25*width), 0);
            // issuer logo
            testDoc.addImage(parsedIssue, (.16*width), (.17*height), 0, (.16*height));
            // signature
            testDoc.addImage(parsedSig, (.125*width), (.67*height), 0, (.10*height));
            // text line. jsPDF line function broken
            testDoc.text(sigLine,(.125*width), (.76*height));
            
            // add strings
            // date
            testDoc.setFontSize(12);
            testDoc.text(date, (.125*width), (.37*height));
            // name
            testDoc.setFontSize(22);
            testDoc.text(name, (.125*width), (.43*height));

            // build string based on distinction flag
            var distStr = 'has successfully completed ';
            if (distinction){
                distStr += 'with distinction';
                // add distinction tag above logo
                testDoc.setFontSize(10);
                testDoc.text('With Distinction', (.74*width), (.33*height));
            }
            testDoc.setFontSize(10);
            testDoc.text(distStr, (.125*width), (.47*height));

            // course title
            testDoc.setFontSize(18);
            testDoc.text(courseTitle, (.125*width), (.53*height));

            // course description
            testDoc.setFontSize(11);
            var splitDesc = textWrapper(courseDesc, 55);
            testDoc.text((.125*width), (.57*height), splitDesc,);

            // signature block
            testDoc.setFontSize(9);
            var splitSig = textWrapper(sigBlock, 30);
            testDoc.text(splitSig,(.14*width), (.79*height));

            // verification block
            var splitVer= textWrapper(verification, 45);
            testDoc.text(splitVer,(.59*width), (.85*height));

            // verified tag above logo
            testDoc.setFontSize(20);
            testDoc.text('Verified Certificate', (.68*width), (.24*height));
            //PDF SECTION ============================================================================

            //send pdf file and reload the page
            testDoc.save('certificate.pdf');
            location.reload();
        } // All URLs parsed------------------------------------------------
    } else { // Did not have permissions for URLs
        // reload form to reset fields, reset flags
        location.reload();
    } // 1st if ---------------------
} // end pdfBuild() --------------------------------------------------------

// VARS ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
//URLs to be converted
var logoURL ='', sigImgURL ='', issuingURL ='', tempFill ='',
// strings
date = '', name = '', courseTitle = '', courseDesc = '', sigBlock = '', verification = '',
// boolean
distinction = true;
// control flags ----------------------------------------------------------------------
var d1 = false, d2 = false, d3 = false, d4 = false; // D# used to indicate that URL parse is complete
var a1 = true, a2 = true, a3 = true, a4 = true;     // A# used to indicate that there are no errors with the URL
// parsed strings ----------------------------------------------------------
var parsedLogo = '', parsedSig = '', parsedIssue = '', parsedTemplate = '';