﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Callcenter.Models
{
    public class ToAddRequest
    {
        public string id { get; set; }
        public string phone { get; set; }
        public string zip { get; set; }
        public EntryRequest request { get; set; }
    }
}
