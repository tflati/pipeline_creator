app.directive("importSheetJs", ['$parse', SheetJSImportDirective]);

function SheetJSImportDirective($parse) {
	  return {
	    scope: {
	    	opts: '=',
	    	importSheetJs: '&'
	    },
	    link: function ($scope, $elm) {
	    	
	      $elm.on('change', function (changeEvent) {
	        var reader = new FileReader();

	        reader.onload = function (e) {
	          /* read workbook */
	          var bstr = e.target.result;
	          var workbook = XLSX.read(bstr, {type:'binary'});

	          /* DO SOMETHING WITH workbook HERE */
	          console.log(workbook);
	          var results = [];
	          for(sheet in workbook.Sheets){
	        	  sheetData = workbook.Sheets[sheet];
	        	  var range = XLSX.utils.decode_range(sheetData['!ref']);
		          json_data = XLSX.utils.sheet_to_json(sheetData, {header:1});
		          
		          for(rowNum = range.s.r; rowNum <= range.e.r; rowNum++){
		              row = [];
		              for(colNum=range.s.c; colNum<=range.e.c; colNum++){
		            	  var nextCell = sheetData[XLSX.utils.encode_cell({r: rowNum, c: colNum})];
		            	  
		            	  if(nextCell != undefined && nextCell.w.indexOf("SRR") == 0) results.push(nextCell.w);
		              }
		              
//		              results.push(row);
		           }
		          
		          $scope.importSheetJs()(results);
	          }
	        };

	        reader.readAsBinaryString(changeEvent.target.files[0]);
	      });
	    }
	  };
	}